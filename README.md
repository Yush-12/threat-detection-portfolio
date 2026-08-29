# 🛡️ Serverless SIEM Pipeline

A cloud-native Security Information and Event Management (SIEM) platform that generates synthetic banking logs, performs automated threat detection using **Sigma rules**, enriches findings with **MITRE ATT&CK** intelligence, calculates **Entity Risk Scores**, and visualizes the results on a modern, interactive **Next.js dashboard**.

Built to demonstrate practical security engineering: detection engineering, log analysis, threat intelligence enrichment, entity risk profiling, and interactive security data visualization.

### 🌐 [Live Demo →](https://threatdetectionportfolio.vercel.app)

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Next.js Dashboard                                    │
│                                                                                        │
│  [Generate Logs]  [Upload Logs]  [Search Bar]  [MITRE Filter Badges]                   │
│                                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Severity Chart  │  │ Risk Scoreboard  │  │  MITRE Heatmap   │  │  Alerts Table  │  │
│  │ (Donut + Triage) │  │  (User / IP)     │  │ (14 Tactics + ↗) │  │ (+ Detail View)│  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                           ▲                                            │
│        API Routes                         │                                            │
│  ┌────────────────────────────────────────┼─────────────────────────────────────────┐  │
│  │ /api/generate    /api/upload    /api/metrics    /api/risk    /api/alerts/[id]    │  │
│  │    [POST]           [POST]         [GET]          [GET]          [PATCH]         │  │
│  └────────────────────────────────────────┼─────────────────────────────────────────┘  │
│                                           │                                            │
│                        lib/ (TypeScript Security Engine)                               │
│        ├── siem-engine.ts  (Sigma evaluation, MITRE lookup, threshold grouping)        │
│        ├── risk-engine.ts  (Multi-factor entity risk scoring with time decay)          │
│        └── mongodb.ts      (Singleton connection pooling for serverless)               │
└───────────────────────────────────────────┼────────────────────────────────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  MongoDB Atlas  │
                                   │  raw_logs       │
                                   │  alerts         │
                                   │  dashboard_     │
                                   │    metrics      │
                                   └─────────────────┘
```

---

## 🔍 Detection Rules

The pipeline evaluates **7 Sigma-format detection rules** against the raw log data, featuring both single-event checks and time-window threshold aggregations:

| Rule | Severity | MITRE Technique | Type | Description |
|------|----------|-----------------|------|-------------|
| **Credential Stuffing** | 🟠 High | [T1110.004](https://attack.mitre.org/techniques/T1110/004/) | Threshold (5 min) | 5+ failed logins from a single IP address |
| **Brute Force** | 🟠 High | [T1110](https://attack.mitre.org/techniques/T1110/) | Threshold (10 min) | 10+ repeated failed logins from a single source |
| **Impossible Travel** | 🟠 High | [T1078](https://attack.mitre.org/techniques/T1078/) | Threshold (1 hr) | Consecutive logins for the same user across multiple countries |
| **Off-Hours Access** | 🟡 Medium | [T1078](https://attack.mitre.org/techniques/T1078/) | Time Range | Successful authentication during 00:00–05:00 UTC |
| **Suspicious High-Value Transfer** | 🔴 Critical | [T1657](https://attack.mitre.org/techniques/T1657/) | Single Event | Financial transfer exceeding abnormal risk thresholds |
| **Privilege Escalation** | 🔴 Critical | [T1078.004](https://attack.mitre.org/techniques/T1078/004/) | Single Event | Unauthorized role changes to admin or superadmin |
| **Successful Login Monitoring** | 🔵 Low | [T1078](https://attack.mitre.org/techniques/T1078/) | Single Event | Baseline tracking of normal authentication activity |

---

## 📊 Dashboard Features

- **🗺️ Interactive MITRE ATT&CK Matrix** — Full 14-tactic grid color-coded by maximum threat severity (Critical = Rose, High = Amber, Low = Blue). Clicking any technique filters the entire dashboard.
- **🔗 Direct MITRE Knowledge Base Links** — Every technique badge links directly to the official MITRE documentation (`https://attack.mitre.org/techniques/Txxx/`).
- **🏆 Entity Risk Scoreboard** — Calculates multi-factor risk scores for Users and IPs based on severity weight, technique diversity multipliers, and exponential time decay.
- **📋 Alert Detail Drawer & Triage Workflow** — Slide-out inspection panel with one-click status updates (`Open`, `Investigating`, `Resolved`, `False Positive`) and raw JSON event inspector.
- **⚡ Dynamic Dataset Generation** — Generate 300–600 randomized synthetic logs with realistic banking attack scenarios right in the browser.
- **📁 Custom Log Upload** — Upload custom `.json` log files to run through the detection and risk engine.
- **📄 Server-Side Pagination & Search** — Search by User, IP, or Rule Title with fast MongoDB aggregation queries.
- **🎯 Multi-Column Sorting** — Chain multiple sorting criteria (e.g., Severity ➔ Time) using `Shift + Click` with custom severity weighting.

---

## 📁 Log Upload Format

To use the **"Upload Logs"** feature, provide a `.json` file containing an array of log objects. Use the included `sample_logs.json` as a template.

### Required Schema:
```json
[
  {
    "action": "string",      // REQUIRED: 'login_failed', 'high_value_transfer', 'role_change', etc.
    "user": "string",        // Optional
    "ip_address": "string",  // Optional
    "timestamp": "ISO-8601", // Optional (defaults to current time)
    "location": "string",    // Optional
    "device": "string",      // Optional
    "amount": 150000,        // Optional (for transfer actions)
    "old_role": "analyst",   // Optional (for role change actions)
    "new_role": "superadmin" // Optional (for role change actions)
  }
]
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** installed
- **MongoDB Atlas** cluster (free tier works)

### 1. Clone & Install
```bash
git clone https://github.com/Yush-12/threat-detection-portfolio.git
cd threat-detection-portfolio/dashboard
npm install
```

### 2. Set Up Environment Variables
Create a `dashboard/.env.local` file:
```env
MONGO_URI="your_mongodb_connection_string_here"
```

### 3. Run Locally
```bash
npm run dev
```
Visit **http://localhost:3000** and click **"Generate Logs"** to see the pipeline in action!

---

## 📁 Project Structure

```
threat-detection-portfolio/
├── dashboard/                     # Next.js Fullstack SIEM Application
│   ├── app/
│   │   ├── api/
│   │   │   ├── alerts/[id]/       # PATCH status endpoint
│   │   │   ├── generate/          # POST synthetic log generator
│   │   │   ├── metrics/           # GET aggregated metrics & paginated alerts
│   │   │   ├── risk/              # GET entity risk scores
│   │   │   └── upload/            # POST custom log upload endpoint
│   │   ├── components/
│   │   │   ├── AlertDetailDrawer.tsx # Slide-in drawer & triage workflow
│   │   │   ├── AlertsTable.tsx    # Interactive table with multi-sort & search
│   │   │   ├── MetricCards.tsx    # Top metric summary cards
│   │   │   ├── MitreHeatmap.tsx   # 14-tactic severity-coded MITRE matrix
│   │   │   ├── RiskScoreboard.tsx # Top risky Users and IPs leaderboard
│   │   │   └── SeverityChart.tsx  # Donut chart & triage status distribution
│   │   ├── lib/
│   │   │   ├── mongodb.ts         # Singleton connection pool
│   │   │   ├── risk-engine.ts     # Multi-factor entity risk scoring engine
│   │   │   └── siem-engine.ts     # Sigma rule evaluator & MITRE enrichment
│   │   ├── page.tsx               # Main Dashboard page
│   │   └── layout.tsx             # Root layout
│   └── public/                    # Static assets
├── rules/                         # Sigma Rule Definitions (YAML)
├── run_siem_pipeline.py           # Python SIEM Engine (batch automation)
├── sample_logs.json               # Reference template for uploads
├── requirements.txt               # Python dependencies
└── README.md
```

---

## 🧠 Key Design Decisions

1. **Hybrid SIEM Architecture** — High-performance TypeScript engine for serverless web interaction paired with Python for batch/CI automation.
2. **Severity-Driven MITRE Heatmap** — MITRE matrix color mapping is driven by detected threat severity rather than raw hit volume, preventing high-volume benign logins from masking critical threats.
3. **Multi-Factor Risk Profiling** — Risk scoring combines severity weighting, attack technique diversity multipliers, and exponential time decay for realistic SOC prioritization.
4. **Serverless Connection Pooling** — Uses cached global MongoDB client promises to prevent connection exhaustion across Next.js API routes.
5. **Zero-Latency External Documentation** — Dynamic URL formatting for all MITRE techniques and sub-techniques (`T1078.004` → `https://attack.mitre.org/techniques/T1078/004/`).

---

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.
