import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    return NextResponse.json(
      { error: 'MONGO_URI environment variable is not defined' },
      { status: 500 }
    );
  }

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

    // Fetch all alerts to allow for complete client-side sorting/filtering
    const allAlerts = await db
      .collection('alerts')
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({
      metrics: latestMetrics,
      alerts: allAlerts,
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
