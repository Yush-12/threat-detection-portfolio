# 🛡️ Serverless SIEM Pipeline

A cloud-native Security Information and Event Management (SIEM) pipeline that generates synthetic banking logs, performs automated threat detection using **Sigma rules**, enriches findings with **MITRE ATT&CK** intelligence, and visualizes the results on a modern **Next.js dashboard**.

Built to demonstrate practical security engineering skills: detection engineering, log analysis, threat intelligence enrichment, and security data visualization.

### 🌐 [Live Demo →](https://threatdetectionportfolio.vercel.app)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    GitHub Actions (Daily Cron)                    │
│                      Triggers Pipeline Run                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Python SIEM Engine                               │
│                                                                  │
│  1. Generate 5,000+ synthetic banking logs (Faker)               │
│  2. Evaluate 5 Sigma detection rules against raw logs            │
│  3. Enrich matched alerts with MITRE ATT&CK technique data      │
│  4. Calculate dashboard metrics & severity breakdowns            │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                                │
│                                                                  │
│  Collections: raw_logs │ alerts │ dashboard_metrics              │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Next.js Dashboard                              │
│                                                                  │
│  • Real-time severity breakdown (Pie Chart)                      │
│  • Top MITRE ATT&CK techniques (Bar Chart)                      │
│  • Sortable alerts table with multi-column sorting               │
│  • Confidence scoring with visual progress bars                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
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

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend Engine** | Python 3.10 |
| **Log Generation** | Faker |
| **Detection Rules** | Sigma (YAML format) |
| **Threat Intelligence** | MITRE ATT&CK (STIX 2.0 via `mitreattack-python`) |
| **Database** | MongoDB Atlas |
| **Frontend** | Next.js 16, React, Tailwind CSS |
| **Charts** | Recharts |
| **CI/CD** | GitHub Actions (daily scheduled pipeline) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** installed
- **Node.js 18+** installed
- **MongoDB Atlas** cluster (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/Yush-12/threat-detection-portfolio.git
cd threat-detection-portfolio
```

### 2. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up MongoDB

Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) and get your connection string.

### 4. Run the SIEM Pipeline

```bash
# Set your MongoDB connection string
export MONGO_URI="mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority"

# Execute the pipeline
python run_siem_pipeline.py
```

Expected output:
```
Connected to MongoDB.
Clearing raw_logs collection...
raw_logs cleared.
Generating 5,000 synthetic logs...
Inserted 5035 logs into raw_logs.
Evaluating rules and enriching alerts...
Loading MITRE ATT&CK data...
Generated and inserted 4000+ alerts into alerts collection.
Calculating dashboard metrics...
Metrics calculated and stored in dashboard_metrics collection.
Pipeline execution completed.
```

### 5. Launch the Dashboard

```bash
cd dashboard
npm install
```

Create a `dashboard/.env.local` file with your MongoDB connection string:
```env
MONGO_URI="your_mongodb_connection_string_here"
```

Start the dev server:
```bash
npm run dev
```

Visit **http://localhost:3000** to see your dashboard.

---

## 📊 Dashboard Features

- **Summary Cards** — Total alerts, High/Critical count, and last pipeline run timestamp
- **Severity Breakdown** — Interactive donut chart with color-coded severity levels
- **MITRE ATT&CK Techniques** — Horizontal bar chart of the top 5 detected techniques
- **Search & Filter** — Instantly filter alerts by username, IP address, or rule title
- **Sortable Alerts Table** — Multi-column sorting (click to sort, Shift+click for combined sorting)
- **Confidence Scoring** — Visual progress bars indicating detection confidence per alert
- **3-Way Sort Toggle** — Click: ASC → DESC → Default

---

## ⚙️ CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/siem-pipeline.yml`) runs the pipeline automatically:

- **Schedule**: Daily at midnight UTC
- **Manual Trigger**: Can be run on-demand via `workflow_dispatch`
- **Secrets**: `MONGO_URI` stored as a GitHub repository secret

---

## 📁 Project Structure

```
threat-detection-portfolio/
├── .github/
│   └── workflows/
│       └── siem-pipeline.yml       # GitHub Actions workflow
├── dashboard/
│   └── app/
│       ├── api/metrics/route.ts    # Next.js API route (MongoDB → Frontend)
│       ├── page.tsx                # Dashboard UI (React + Recharts)
│       └── layout.tsx              # App layout
├── rules/
│   ├── credential_stuffing.yml     # Sigma: Credential Stuffing
│   ├── brute_force.yml             # Sigma: Brute Force Detection
│   ├── suspicious_transfer.yml     # Sigma: High-Value Transfer
│   ├── privilege_escalation.yml    # Sigma: Privilege Escalation
│   └── login_success.yml          # Sigma: Login Monitoring (Baseline)
├── run_siem_pipeline.py            # Main pipeline script
├── requirements.txt                # Python dependencies
└── README.md
```

---

## 🧠 Key Design Decisions

1. **Native Sigma Evaluation** — Instead of relying on the community `pySigma-backend-mongodb` (which has compatibility issues with Python 3.10+), the pipeline uses native YAML parsing and direct MongoDB queries for reliable rule evaluation.

2. **MITRE ATT&CK Enrichment** — Each alert is enriched with MITRE technique IDs via the official STIX 2.0 dataset, providing standardized threat intelligence context.

3. **Client-Side Sorting** — The dashboard loads all alerts and performs sorting in the browser, enabling instant multi-column sorting without additional API calls.

4. **Synthetic but Realistic Data** — The log generator creates realistic attack patterns (brute force bursts, credential stuffing from single IPs, high-value transfers) alongside normal banking activity.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
