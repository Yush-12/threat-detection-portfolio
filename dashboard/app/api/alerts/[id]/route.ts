import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { computeMetrics, Alert } from '../../../lib/siem-engine';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    
    if (!['open', 'investigating', 'resolved', 'false_positive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('alerts').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Recompute metrics
    const allAlerts = await db.collection('alerts').find({}).toArray() as unknown as Alert[];
    const metrics = computeMetrics(allAlerts);
    await db.collection('dashboard_metrics').deleteMany({});
    await db.collection('dashboard_metrics').insertOne(metrics);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error updating alert status:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}

