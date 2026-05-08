import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    return NextResponse.json(
      { error: 'MONGO_URI environment variable is not defined' },
      { status: 500 }
    );
  }

  // Parse pagination & sorting params
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
  const sortParam = searchParams.get('sort');
  let sortConfigs: { key: string; direction: 'asc' | 'desc' }[] = [];
  
  try {
    if (sortParam) sortConfigs = JSON.parse(sortParam);
  } catch {
    sortConfigs = [{ key: 'timestamp', direction: 'desc' }];
  }
  
  const skip = (page - 1) * limit;

  let client;

  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db('siem_db');

    // Fetch metrics
    const latestMetricsArray = await db
      .collection('dashboard_metrics')
      .find({})
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();
    const latestMetrics = latestMetricsArray.length > 0 ? latestMetricsArray[0] : null;

    // Build the aggregation pipeline for severity weighting
    const pipeline: any[] = [
      {
        $addFields: {
          severity_weight: {
            $switch: {
              branches: [
                { case: { $eq: [{ $toLower: "$severity" }, "critical"] }, then: 4 },
                { case: { $eq: [{ $toLower: "$severity" }, "high"] }, then: 3 },
                { case: { $eq: [{ $toLower: "$severity" }, "medium"] }, then: 2 },
                { case: { $eq: [{ $toLower: "$severity" }, "low"] }, then: 1 }
              ],
              default: 0
            }
          }
        }
      }
    ];

    // Build the multi-key sort object
    let sortObj: any = {};
    if (sortConfigs.length > 0) {
        sortConfigs.forEach(config => {
            const order = config.direction === 'asc' ? 1 : -1;
            if (config.key === 'severity') {
                sortObj.severity_weight = order;
            } else {
                sortObj[config.key] = order;
            }
        });
        // Always ensure timestamp is a fallback if not already included
        if (!sortObj.timestamp) sortObj.timestamp = -1;
    } else {
        sortObj = { timestamp: -1 };
    }

    const totalAlerts = await db.collection('alerts').countDocuments();
    const totalPages = Math.ceil(totalAlerts / limit);

    const alerts = await db
      .collection('alerts')
      .aggregate([
        ...pipeline,
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    return NextResponse.json({
      metrics: latestMetrics,
      alerts,
      pagination: {
        currentPage: page,
        totalPages,
        totalAlerts,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from database' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
