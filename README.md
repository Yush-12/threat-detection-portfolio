# 🛡️ Serverless SIEM Pipeline

A cloud-native Security Information and Event Management (SIEM) pipeline that generates synthetic logs, performs automated threat detection using **Sigma rules**, enriches findings with **MITRE ATT&CK** intelligence, and visualizes the results on a modern, interactive **Next.js dashboard**.

Built to demonstrate practical security engineering: detection engineering, log analysis, threat intelligence enrichment, and interactive security data visualization.

### 🌐 [Live Demo →](https://threatdetectionportfolio.vercel.app)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                  Next.js Dashboard               │
│                                                  │
│  [Generate Logs]  [Upload Logs]  [Search Bar]    │
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │
│  │ Charts  │  │ Metrics │  │  Alerts Table   │  │
│  │(Recharts│  │  Cards  │  │  + Pagination   │  │
│  └─────────┘  └─────────┘  └─────────────────┘  │
│                    ▲                             │
│        API Routes  │                             │
│  ┌─────────────────┼──────────────────────────┐  │
│  │ /api/generate   │  /api/upload  /api/metrics│  │
│  │     POST        │     POST        GET      │  │
│  └─────────────────┼──────────────────────────┘  │
│                    │                             │
│         lib/siem-engine.ts (TypeScript)          │
│  (rules, MITRE map, evaluation, metrics)         │
└──────────────────────┼───────────────────────────┘
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

The pipeline evaluates **5 Sigma-format detection rules** against the raw log data:

| Rule | Severity | MITRE Technique | Description |
|------|----------|-----------------|-------------|
| **Credential Stuffing** | 🟠 High | T1110.004 | Failed logins from multiple users on the same IP |
| **Brute Force** | 🟠 High | T1110 | Repeated authentication failures from a single source |
| **Suspicious High-Value Transfer** | 🔴 Critical | T1657 | Fund transfers exceeding normal thresholds |
| **Privilege Escalation** | 🔴 Critical | T1078.004 | Unauthorized role/permission changes |
| **Successful Login Monitoring** | 🔵 Low | T1078 | Baseline tracking of valid authentication events |

---

## 📊 Dashboard Features

- **⚡ Generate Logs** — Instant, in-browser log generation using a TypeScript port of the SIEM engine.
- **📁 Upload Logs** — Analyze your own custom `.json` logs against the rule set.
- **📄 Pagination** — Efficiently browse thousands of alerts with server-side pagination.
- **Summary Cards** — Total alerts, High/Critical count, and last pipeline run timestamp.
- **Severity Breakdown** — Interactive donut chart with color-coded severity levels.
- **MITRE ATT&CK Techniques** — Horizontal bar chart of the top 5 detected techniques.
- **Search & Filter** — Instantly filter alerts by username, IP address, or rule title.
- **Sortable Table** — Multi-column sorting (click to sort, Shift+click for combined sorting).
- **Confidence Scoring** — Visual progress bars indicating detection confidence per alert.

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
Visit **http://localhost:3000** and click **"Generate Logs"** to populate your dashboard!

---

## ⚙️ Automated Pipeline (Python)

While the dashboard is now self-sufficient, the project still includes a Python-based pipeline (`run_siem_pipeline.py`) for automated batch processing.

- **CI/CD**: The GitHub Actions workflow (`.github/workflows/siem-pipeline.yml`) runs the Python engine daily to ensure the live demo always has fresh data.
- **Cron**: Daily at 00:00 UTC.

---

## 📁 Project Structure

```
threat-detection-portfolio/
├── .github/workflows/       # GitHub Actions (Automated daily runs)
├── dashboard/               # Next.js Application
│   ├── app/
│   │   ├── api/             # Generate, Upload, & Metrics endpoints
│   │   ├── lib/             # Core SIEM Engine (TypeScript port)
│   │   ├── page.tsx         # Dashboard UI
│   │   └── layout.tsx       # App layout
│   └── public/              # Assets
├── rules/                   # Sigma Rule Definitions (YAML)
├── run_siem_pipeline.py     # Python SIEM Engine
├── requirements.txt         # Python dependencies
└── README.md
```

---

## 🧠 Key Design Decisions

1. **Hybrid SIEM Engine** — The core detection logic is implemented in both Python (for automated batch jobs) and TypeScript (for real-time interactive use in the browser).
2. **Serverless Generation** — Log generation is scaled to ~500 logs per click to stay within Vercel's 10-second serverless execution limit while providing a realistic demo.
3. **Static MITRE Mapping** — To ensure high performance on the dashboard, we use a static lookup map for MITRE ATT&CK techniques instead of downloading the full 47MB dataset at runtime.
4. **Server-Side Pagination** — Enables the platform to scale to tens of thousands of alerts without degrading browser performance.

---

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.
