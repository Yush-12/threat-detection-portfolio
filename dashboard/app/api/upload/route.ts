import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { runPipeline, RawLog } from '../../lib/siem-engine';

export async function POST(request: NextRequest) {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    return NextResponse.json(
      { error: 'MONGO_URI environment variable is not defined' },
      { status: 500 }
    );
  }

  let client;

  try {
    // Parse the uploaded file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a JSON file.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a .json file.' },
        { status: 400 }
      );
    }

    // Parse JSON content
    const text = await file.text();
    let parsedLogs: RawLog[];

    try {
      const parsed = JSON.parse(text);
      // Accept both array and single object
      parsedLogs = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON format. File must contain a valid JSON array of log objects.' },
        { status: 400 }
      );
    }

    // Validate that logs have minimum required fields
    const validLogs = parsedLogs.filter(
      (log) => log.action && typeof log.action === 'string'
    );

    if (validLogs.length === 0) {
      return NextResponse.json(
        { error: 'No valid logs found. Each log must have at least an "action" field.' },
        { status: 400 }
      );
    }

    // Fill in defaults for missing fields
    const normalizedLogs: RawLog[] = validLogs.map((log) => ({
      timestamp: log.timestamp || new Date().toISOString(),
      user: log.user || 'unknown',
      action: log.action,
      ip_address: log.ip_address || '0.0.0.0',
      location: log.location || 'Unknown',
      device: log.device || 'unknown',
      ...(log.amount !== undefined && { amount: log.amount }),
      ...(log.destination_account && { destination_account: log.destination_account }),
      ...(log.old_role && { old_role: log.old_role }),
      ...(log.new_role && { new_role: log.new_role }),
    }));

    client = new MongoClient(uri);
    await client.connect();
    const db = client.db('siem_db');

    // Run pipeline — do NOT clear existing data, append uploaded logs
    const result = await runPipeline(db, normalizedLogs, false);

    return NextResponse.json({
      success: true,
      message: `Uploaded ${result.totalLogs} logs → ${result.totalAlerts} new alerts in ${result.duration}`,
      ...result,
    });
  } catch (error) {
    console.error('Error processing uploaded logs:', error);
    return NextResponse.json(
      { error: 'Failed to process uploaded logs. Please try again.' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
