import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/mongodb';
import { computeEntityRiskScores } from '../../lib/risk-engine';
import { Alert } from '../../lib/siem-engine';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const alerts = await db.collection('alerts').find({}).toArray() as unknown as Alert[];
    
    const riskyEntities = computeEntityRiskScores(alerts);

    return NextResponse.json({ success: true, data: riskyEntities });
  } catch (error) {
    console.error('Error fetching risk scores:', error);
    return NextResponse.json({ error: 'Failed to fetch risk data' }, { status: 500 });
  }
}
