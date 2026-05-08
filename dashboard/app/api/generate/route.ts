import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { generateSyntheticLogs, runPipeline } from '../../lib/siem-engine';

export async function POST() {
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

    // Generate synthetic logs
    const logs = generateSyntheticLogs();

    // Run the full pipeline (clear existing, insert logs, evaluate rules, compute metrics)
    const result = await runPipeline(db, logs, true);

    return NextResponse.json({
      success: true,
      message: `Generated ${result.totalLogs} logs → ${result.totalAlerts} alerts in ${result.duration}`,
      ...result,
    });
  } catch (error) {
    console.error('Error running generate pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to generate logs. Please try again.' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
