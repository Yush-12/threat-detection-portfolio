# 🛡️ Serverless SIEM Pipeline

A cloud-native Security Information and Event Management (SIEM) platform that generates synthetic banking logs, performs automated threat detection using **Sigma rules**, enriches findings with **MITRE ATT&CK** intelligence, calculates **Entity Risk Scores**, correlates multi-stage attacks into **Active Incidents**, and visualizes findings on a modern, high-contrast **Next.js SOC Dashboard**.

Built to demonstrate end-to-end security engineering: detection engineering, log analysis, threat intelligence correlation, entity risk profiling, incident reporting, and interactive data visualization.

### 🌐 [Live Demo →](https://threatdetectionportfolio.vercel.app)

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           Next.js Dashboard                                            │
│                                                                                                        │
│  [Generate Logs]  [Upload Logs]  [Export Report (PDF/CSV)]  [Theme Switcher (View Transitions)]        │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Active Correlated Security Incidents                                │  │
│  │                       (Multi-stage attack campaigns grouped by adversary)                        │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │   Alert Volume Timeline │  │   Global Threat Origins │  │       Live Threat Telemetry Feed       │  │
│  │   (Hourly/Daily Bursts) │  │  (SVG Map + Coordinates)│  │       (Real-time Activity Stream)      │  │
│  └─────────────────────────┘  └─────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │   Severity Donut Chart  │  │   Top Risky Entities    │  │       14-Tactic MITRE Matrix           │  │
│  │   (+ Triage Status Bars)│  │   (Leaderboard + Drill) │  │       (Severity-Coded Heatmap)         │  │
│  └─────────────────────────┘  └─────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      Alerts Table with Multi-Sort, Pagination & Search                           │  │
│  │             (+ Alert Detail Triage Drawer & Deep Entity Investigation Drawer)                    │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                   ▲                                                    │
│        API Routes                                 │                                                    │
│  ┌────────────────────────────────────────────────┼─────────────────────────────────────────────────┐  │
│  │ /api/generate    /api/upload    /api/metrics    /api/risk    /api/alerts/[id]                    │  │
│  │    [POST]           [POST]         [GET]          [GET]          [PATCH]                         │  │
│  └────────────────────────────────────────────────┼─────────────────────────────────────────────────┘  │
│                                                   │                                                    │
│                        lib/ (TypeScript Security Engine)                                       │
│        ├── siem-engine.ts         (Sigma rules, MITRE enrichment, incident correlation)                │
│        ├── risk-engine.ts         (Multi-factor entity risk scoring with time decay)                  │
│        ├── country-coordinates.ts (240+ world country centroid mapping & normalization)               │
│        └── mongodb.ts             (Singleton connection pooling for serverless)                       │
└───────────────────────────────────────────────────┼────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │  MongoDB Atlas  │
                                           │  raw_logs       │
                                           │  alerts         │
                                           │  incidents      │
                                           │  metrics        │
                                           └─────────────────┘
```

---

## 🔍 Detection Rules

The pipeline evaluates **7 Sigma-format detection rules** against raw security telemetry, featuring both single-event signatures and time-window threshold aggregations:

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

- **🧠 Automated Incident Correlation** — Groups multi-stage adversary behaviors across detection rules into high-priority attack incidents, prioritized with `CRITICAL` incidents first.
- **🗺️ Interactive MITRE ATT&CK Matrix** — 14-tactic matrix color-coded by highest detected severity (Critical = Rose, High = Amber, Medium = Yellow, Low = Blue). Clicking any cell filters the dashboard.
- **📈 Real-Time Alert Timeline** — Stacked gradient area chart showing attack bursts and alert distribution over time across days and hours.
- **🌐 Global Threat Origins Geo Map** — SVG world projection with 240+ country centroids and high-contrast tooltip badges plotting adversary geographic locations.
- **🔍 Deep Threat Investigation View** — Drill-down drawer showing entity telemetry, observed locations, device footprints, tactics, and event history.
- **📡 Live Threat Feed** — Real-time event feed with pulse indicators for continuous SOC awareness.
- **📄 Incident Report Exports (PDF & CSV)** — View and print executive SOC Incident Reports in a new tab via `jsPDF`/`autoTable` or download raw alert CSVs.
- **🌗 View Transitions Dark/Light Theme Engine** — Seamless circular ripple reveal animation powered by the modern View Transitions API with Stripe/Linear-grade contrast.
- **🏆 Entity Risk Scoreboard** — Calculates multi-factor risk scores for Users and IPs based on severity weight, technique diversity multipliers, and exponential time decay.
- **📋 Alert Detail Drawer & Triage Workflow** — Inspection panel with status transitions (`Open`, `Investigating`, `Resolved`, `False Positive`) and raw JSON event inspector.
- **⚡ Dynamic Dataset Generation** — Generates 300–600 randomized synthetic logs with multi-day realistic attack scenarios.
- **📁 Custom Log Upload** — Upload custom `.json` logs to process through the detection, risk, and correlation engine.
- **📄 Server-Side Pagination & Search** — Search by User, IP, or Rule Title with fast MongoDB aggregation queries.
- **🎯 Multi-Column Sorting** — Chain multiple sorting criteria (e.g., Severity ➔ Time) using `Shift + Click`.

---

## 📁 Log Upload Format

To use the **"Upload Logs"** feature, provide a `.json` file containing an array of log objects:

```json
[
  {
    "timestamp": "2026-05-08T10:00:00Z",
    "user": "security_test_user",
    "action": "login_failed",
    "ip_address": "192.168.1.100",
    "location": "United States",
    "device": "desktop"
  },
  {
    "timestamp": "2026-05-08T10:05:00Z",
    "user": "security_test_user",
    "action": "high_value_transfer",
    "ip_address": "192.168.1.100",
    "location": "United States",
    "device": "desktop",
    "amount": 75000.50,
    "destination_account": "GB123456789"
  }
]
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** installed
- **MongoDB Atlas** cluster (or local MongoDB)

### 1. Clone & Install
```bash
git clone https://github.com/Yush-12/threat-detection-portfolio.git
cd threat-detection-portfolio/dashboard
npm install --legacy-peer-deps
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
Visit **http://localhost:3000** and click **"Generate Logs"**!

### 4. Run Automated Tests
```bash
npm run test
```

---

## 📁 Project Structure

```
threat-detection-portfolio/
├── .npmrc                         # npm configuration for legacy peer dependencies
├── vercel.json                    # Vercel deployment configuration
├── dashboard/                     # Next.js Fullstack SIEM Application
│   ├── app/
│   │   ├── api/
│   │   │   ├── alerts/[id]/       # PATCH alert status endpoint
│   │   │   ├── generate/          # POST synthetic log generator
│   │   │   ├── metrics/           # GET aggregated metrics, incidents & paginated alerts
│   │   │   ├── risk/              # GET entity risk scores
│   │   │   └── upload/            # POST custom log upload endpoint
│   │   ├── components/
│   │   │   ├── AlertDetailDrawer.tsx   # Slide-in drawer & triage workflow
│   │   │   ├── AlertsTable.tsx         # Interactive table with multi-sort & search
│   │   │   ├── ExportDropdown.tsx      # PDF preview & CSV incident exporter
│   │   │   ├── GeoMap.tsx              # Global threat origins SVG world map
│   │   │   ├── IncidentsSection.tsx    # Correlated multi-stage attack campaigns
│   │   │   ├── InvestigationDrawer.tsx # Deep entity investigation drawer
│   │   │   ├── LiveActivityFeed.tsx    # Live telemetry feed
│   │   │   ├── MetricCards.tsx         # Top metric summary cards
│   │   │   ├── MitreHeatmap.tsx        # 14-tactic severity-coded MITRE matrix
│   │   │   ├── RiskScoreboard.tsx      # Top risky Users and IPs leaderboard
│   │   │   ├── SeverityChart.tsx       # Donut chart & triage status distribution
│   │   │   ├── ThemeProvider.tsx       # Theme provider wrapper
│   │   │   ├── ThemeToggle.tsx         # View Transitions circular ripple theme switcher
│   │   │   └── TimelineChart.tsx       # Real-time alert volume timeline chart
│   │   ├── lib/
│   │   │   ├── country-coordinates.ts  # 240+ country centroids database
│   │   │   ├── mongodb.ts              # Singleton connection pool
│   │   │   ├── rate-limit.ts           # In-memory sliding window rate limiter
│   │   │   ├── risk-engine.ts          # Multi-factor entity risk scoring engine
│   │   │   └── siem-engine.ts          # Sigma rules, MITRE enrichment, incident correlation
│   │   ├── page.tsx                    # Main Dashboard page
│   │   ├── layout.tsx                  # Root layout
│   │   └── globals.css                 # Global Tailwind theme styling
│   ├── .npmrc                         # Dashboard npm configuration
│   ├── vercel.json                    # Dashboard Vercel configuration
│   └── public/                        # Static assets
└── README.md
```

---

## 🧠 Key Design Decisions

1. **Unified Fullstack Architecture** — High-performance TypeScript security engine running seamlessly across serverless Next.js edge and node runtimes.
2. **Severity-Driven MITRE Heatmap** — MITRE matrix color mapping is driven by detected threat severity rather than raw hit volume, preventing high-volume benign logins from masking critical threats.
3. **Multi-Factor Risk Profiling** — Risk scoring combines severity weighting, attack technique diversity multipliers, and exponential time decay for realistic SOC prioritization.
4. **Serverless Connection Pooling** — Uses cached global MongoDB client promises to prevent connection exhaustion across Next.js API routes.
5. **View Transitions Ripple Theme Engine** — Circular clip-path reveal providing smooth, flash-free transitions between Obsidian SOC dark mode and Porcelain slate light mode.

---

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.
