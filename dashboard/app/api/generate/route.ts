import { NextResponse } from 'next/server';
import { generateSyntheticLogs, runPipeline } from '../../lib/siem-engine';
import { getDb } from '../../lib/mongodb';

export async function POST() {
  try {
    const db = await getDb();

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
  }
}
