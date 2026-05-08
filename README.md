# 🛡️ Serverless SIEM Pipeline

A cloud-native Security Information and Event Management (SIEM) platform that generates synthetic banking logs, performs automated threat detection using **Sigma rules**, enriches findings with **MITRE ATT&CK** intelligence, and visualizes the results on a modern, interactive **Next.js dashboard**.

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

- **⚡ Randomized Generation** — Generate dynamic datasets of 300-600 logs with variable attack patterns (no Python required).
- **📁 Custom Log Upload** — Upload `.json` files to analyze external data against the rule engine.
- **💡 Interactive Info Tooltip** — Hover over the `!` on the upload button for an instant guide on JSON schema and alert triggers.
- **📄 Server-Side Pagination** — Smoothly browse thousands of alerts with 25 items per page.
- **🎯 Multi-Column Sorting** — Chain multiple criteria (e.g., Severity ➔ Time) using `Shift + Click`.
- **🔄 3-Way Sort Toggle** — Cycle through sorting states: **DESC ➔ ASC ➔ Default (Reset)**.
- **⚖️ Severity Weighting** — Intelligent sorting that prioritizes **Critical** over **High** regardless of alphabetical order.
- **Summary Cards & Charts** — Real-time severity breakdowns and top MITRE ATT&CK techniques via Recharts.

---

## 📁 Log Upload Format

To use the **"Upload Logs"** feature, provide a `.json` file containing an array of log objects. Use the included `sample_logs.json` as a template.

### Required Schema:
```json
[
  {
    "action": "string",      // REQUIRED: 'login_failed', 'high_value_transfer', etc.
    "user": "string",        // Optional
    "ip_address": "string",  // Optional
    "timestamp": "ISO-8601", // Optional (defaults to current time)
    "location": "string",    // Optional
    "device": "string"       // Optional
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
├── dashboard/               # Next.js Application
│   ├── app/
│   │   ├── api/             # Generate, Upload, & Metrics endpoints
│   │   ├── lib/             # Core SIEM Engine (TypeScript)
│   │   ├── page.tsx         # Dashboard UI
│   └── public/              # Assets
├── rules/                   # Sigma Rule Definitions (YAML)
├── run_siem_pipeline.py     # Python SIEM Engine (for automation)
├── sample_logs.json         # Reference template for uploads
├── requirements.txt         # Python dependencies
└── README.md
```

---

## 🧠 Key Design Decisions

1. **Hybrid SIEM Engine** — Dual-implementation in Python (for automated batch jobs via GitHub Actions) and TypeScript (for real-time dashboard interaction).
2. **Aggregation-Based Sorting** — Uses a custom MongoDB weighting pipeline to ensure security-accurate sorting (Critical > High > Medium > Low).
3. **Race Condition Protection** — Implements loading locks on the frontend to prevent UI hangs during rapid data interactions.
4. **Static MITRE Mapping** — Optimized for serverless environments by using static lookups instead of 47MB heavy file loads.

---

## 📄 License
MIT License — see [LICENSE](LICENSE) for details.
