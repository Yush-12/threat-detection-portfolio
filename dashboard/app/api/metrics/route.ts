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

  // Parse pagination params
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
  const skip = (page - 1) * limit;

  let client;

  try {
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db('siem_db');

    // Fetch the single most recent dashboard_metrics document
    const latestMetricsArray = await db
      .collection('dashboard_metrics')
      .find({})
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    const latestMetrics = latestMetricsArray.length > 0 ? latestMetricsArray[0] : null;

    // Get total count of alerts for pagination
    const totalAlerts = await db.collection('alerts').countDocuments();
    const totalPages = Math.ceil(totalAlerts / limit);

    // Fetch paginated alerts
    const alerts = await db
      .collection('alerts')
      .find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
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
