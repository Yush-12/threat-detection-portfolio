import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/mongodb';
import { SEVERITY_RANK, DashboardMetrics } from '../../lib/siem-engine';
import { checkRateLimit, getClientIp } from '../../lib/rate-limit';
import { Document } from 'mongodb';

export async function GET(request: NextRequest) {
  // Parse pagination, sorting, search, and MITRE filter params
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
  const sortParam = searchParams.get('sort');
  const searchParam = searchParams.get('search')?.trim() || '';
  const techniqueParam = searchParams.get('technique')?.trim() || '';
  let sortConfigs: { key: string; direction: 'asc' | 'desc' }[] = [];
  
  const ip = getClientIp(request);
  if (!checkRateLimit(`metrics_${ip}`, 100, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
  }
  
  try {
    if (sortParam) sortConfigs = JSON.parse(sortParam);
  } catch {
    sortConfigs = [{ key: 'timestamp', direction: 'desc' }];
  }
  
  const skip = (page - 1) * limit;

  try {
    const db = await getDb();

    // Fetch metrics
    const latestMetricsArray = await db
      .collection('dashboard_metrics')
      .find({})
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();
    const latestMetrics = latestMetricsArray.length > 0 ? (latestMetricsArray[0] as unknown as DashboardMetrics) : null;

    const firstTech = latestMetrics?.mitre_techniques ? Object.values(latestMetrics.mitre_techniques)[0] : null;
    if (latestMetrics && (!latestMetrics.mitre_techniques || !firstTech?.max_severity)) {
      const mitreAgg = await db.collection('alerts').aggregate([
        { $match: { "mitre_enrichment.technique_id": { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$mitre_enrichment.technique_id",
            count: { $sum: 1 },
            name: { $first: "$mitre_enrichment.name" },
            tactic: { $first: "$mitre_enrichment.tactic" },
            severities: { $push: "$severity" }
          }
        }
      ]).toArray();

      const mitreTechniques: Record<string, { name: string; tactic: string; count: number; max_severity: string }> = {};
      mitreAgg.forEach(item => {
        let maxSev = 'LOW';
        let maxRank = 0;
        (item.severities || []).forEach((s: string) => {
          const up = (s || '').toUpperCase();
          if ((SEVERITY_RANK[up] || 0) > maxRank) {
            maxRank = SEVERITY_RANK[up];
            maxSev = up;
          }
        });

        mitreTechniques[item._id] = {
          name: item.name || item._id,
          tactic: item.tactic || 'Unknown',
          count: item.count,
          max_severity: maxSev
        };
      });
      latestMetrics.mitre_techniques = mitreTechniques;
    }

    // Build filter query
    const matchQuery: Record<string, unknown> = {};
    if (techniqueParam) {
      matchQuery["mitre_enrichment.technique_id"] = techniqueParam;
    }
    if (searchParam) {
      const regex = { $regex: searchParam, $options: 'i' };
      matchQuery.$or = [
        { rule_title: regex },
        { "hit_log.user": regex },
        { "hit_log.ip_address": regex },
        { "mitre_enrichment.technique_id": regex },
        { "mitre_enrichment.name": regex }
      ];
    }

    // Build the aggregation pipeline
    const pipeline: Document[] = [];

    if (Object.keys(matchQuery).length > 0) {
      pipeline.push({ $match: matchQuery });
    }

    pipeline.push({
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
    });

    // Build the multi-key sort object
    let sortObj: Record<string, 1 | -1> = {};
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

    const totalFilteredAlerts = await db.collection('alerts').countDocuments(matchQuery);
    const totalPages = Math.max(1, Math.ceil(totalFilteredAlerts / limit));

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
        totalAlerts: totalFilteredAlerts,
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
  }
}
