import { NextResponse, NextRequest } from 'next/server';
import { generateSyntheticLogs, runPipeline } from '../../lib/siem-engine';
import { getDb } from '../../lib/mongodb';
import { checkRateLimit, getClientIp } from '../../lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Allow 2 generations per minute (60000ms)
    if (!checkRateLimit(`generate_${ip}`, 2, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a minute.' }, { status: 429 });
    }
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
