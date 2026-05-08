import os
import random
import datetime
import requests
from faker import Faker
from pymongo import MongoClient
import yaml

try:
    from mitreattack.stix20 import MitreAttackData
except ImportError:
    MitreAttackData = None

def clear_raw_logs(db):
    print("Clearing raw_logs collection...")
    db.raw_logs.delete_many({})
    print("raw_logs cleared.")

def generate_logs(db):
    print("Generating 5,000 synthetic logs...")
    fake = Faker()
    logs = []
    
    # Generate 4900 normal logs
    for _ in range(4900):
        logs.append({
            "timestamp": fake.date_time_this_month().isoformat(),
            "user": fake.user_name(),
            "action": random.choice(["login_success", "transfer", "balance_check", "logout"]),
            "ip_address": fake.ipv4(),
            "location": fake.country(),
            "device": random.choice(["mobile", "desktop", "tablet"])
        })
    
    # Generate 50 Credential Stuffing logs (same IP, different users, rapid succession)
    bad_ip = fake.ipv4()
    base_time = fake.date_time_this_month()
    for i in range(50):
        logs.append({
            "timestamp": (base_time + datetime.timedelta(seconds=i*2)).isoformat(),
            "user": fake.user_name(),
            "action": "login_failed",
            "ip_address": bad_ip,
            "location": fake.country(),
            "device": "desktop"
        })
        
    # Generate 50 Impossible Travel logs (same user, different locations far apart in short time)
    victim_user = fake.user_name()
    base_time = fake.date_time_this_month()
    for i in range(50):
        logs.append({
            "timestamp": (base_time + datetime.timedelta(minutes=i*10)).isoformat(),
            "user": victim_user,
            "action": "login_success",
            "ip_address": fake.ipv4(),
            "location": fake.country(),
            "device": "mobile"
        })

    # Generate 20 Suspicious High-Value Transfer logs
    base_time = fake.date_time_this_month()
    for i in range(20):
        logs.append({
            "timestamp": (base_time + datetime.timedelta(hours=i*3)).isoformat(),
            "user": fake.user_name(),
            "action": "high_value_transfer",
            "ip_address": fake.ipv4(),
            "location": fake.country(),
            "device": random.choice(["mobile", "desktop"]),
            "amount": round(random.uniform(50000, 500000), 2),
            "destination_account": fake.iban()
        })

    # Generate 15 Privilege Escalation logs (unauthorized role changes)
    base_time = fake.date_time_this_month()
    for i in range(15):
        logs.append({
            "timestamp": (base_time + datetime.timedelta(hours=i*6)).isoformat(),
            "user": fake.user_name(),
            "action": "role_change",
            "ip_address": fake.ipv4(),
            "location": fake.country(),
            "device": "desktop",
            "old_role": random.choice(["viewer", "analyst"]),
            "new_role": random.choice(["admin", "superadmin"])
        })

    db.raw_logs.insert_many(logs)
    print(f"Inserted {len(logs)} logs into raw_logs.")

def evaluate_rules_and_enrich(db):
    print("Evaluating rules and enriching alerts...")
    if not os.path.exists("./rules"):
        print("Creating ./rules/ directory with sample rules...")
        os.makedirs("./rules")
        
        # Sample Rule 1: Credential Stuffing
        rule1 = """
title: Credential Stuffing
status: experimental
logsource:
    product: banking_app
detection:
    selection:
        action: 'login_failed'
    condition: selection
level: high
tags:
    - attack.t1110.004
"""
        with open("./rules/credential_stuffing.yml", "w") as f:
            f.write(rule1)
            
        # Sample Rule 2: Successful logins
        rule2 = """
title: Successful Login Monitoring
status: experimental
logsource:
    product: banking_app
detection:
    selection:
        action: 'login_success'
    condition: selection
level: low
tags:
    - attack.t1078
"""
        with open("./rules/login_success.yml", "w") as f:
            f.write(rule2)

        # Rule 3: Brute Force
        rule3 = """
title: Brute Force - Multiple Failed Logins from Single IP
status: experimental
logsource:
    product: banking_app
detection:
    selection:
        action: 'login_failed'
    condition: selection
level: high
tags:
    - attack.t1110
"""
        with open("./rules/brute_force.yml", "w") as f:
            f.write(rule3)

        # Rule 4: Suspicious High-Value Transfer
        rule4 = """
title: Suspicious High-Value Transfer
status: experimental
logsource:
    product: banking_app
detection:
    selection:
        action: 'high_value_transfer'
    condition: selection
level: critical
tags:
    - attack.t1657
"""
        with open("./rules/suspicious_transfer.yml", "w") as f:
            f.write(rule4)

        # Rule 5: Privilege Escalation
        rule5 = """
title: Privilege Escalation - Unauthorized Role Change
status: experimental
logsource:
    product: banking_app
detection:
    selection:
        action: 'role_change'
    condition: selection
level: critical
tags:
    - attack.t1078.004
"""
        with open("./rules/privilege_escalation.yml", "w") as f:
            f.write(rule5)

    alerts = []
    
    # Try to initialize MITRE ATT&CK data
    mitre_data = None
    if MitreAttackData:
        try:
            if not os.path.exists("enterprise-attack.json"):
                print("Downloading enterprise-attack.json for MITRE enrichment...")
                url = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
                r = requests.get(url)
                with open("enterprise-attack.json", "w", encoding="utf-8") as f:
                    f.write(r.text)
            print("Loading MITRE ATT&CK data...")
            mitre_data = MitreAttackData("enterprise-attack.json")
        except Exception as e:
            print(f"Failed to load MITRE ATT&CK data: {e}")
    else:
        print("mitreattack-python not installed. Skipping deep MITRE enrichment.")

    for root, dirs, files in os.walk("./rules"):
        for file in files:
            if file.endswith(".yml") or file.endswith(".yaml"):
                rule_path = os.path.join(root, file)
                try:
                    with open(rule_path, "r") as f:
                        rule_data = yaml.safe_load(f)
                        
                    # Extract selection manually to bypass broken PySigma backend
                    query = rule_data.get("detection", {}).get("selection", {})
                    
                    if not query:
                        continue
                        
                    hits = list(db.raw_logs.find(query))
                    
                    for hit in hits:
                        hit.pop("_id", None) # Remove mongo Object ID
                        
                        confidence = random.randint(60, 100)
                        
                        mitre_info = {}
                        tags = rule_data.get("tags", [])
                        for tag in tags:
                            if tag.startswith("attack.t"):
                                technique_id = tag.split(".")[1].upper()
                                if not technique_id.startswith("T"):
                                    technique_id = "T" + technique_id
                                
                                mitre_info["technique_id"] = technique_id
                                if mitre_data:
                                    try:
                                        technique = mitre_data.get_object_by_stix_id(technique_id)
                                        if technique:
                                            mitre_info["name"] = technique.name
                                            mitre_info["description"] = technique.description[:200] + "..." if technique.description else ""
                                    except Exception:
                                        pass
                                        
                        alert = {
                            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                            "rule_title": rule_data.get("title", "Unknown Rule"),
                            "hit_log": hit,
                            "confidence_score": confidence,
                            "mitre_enrichment": mitre_info,
                            "severity": rule_data.get("level", "medium")
                        }
                        alerts.append(alert)
                except Exception as e:
                    print(f"Error processing rule {rule_path}: {e}")

    if alerts:
        db.alerts.insert_many(alerts)
        print(f"Generated and inserted {len(alerts)} alerts into alerts collection.")
    else:
        print("No alerts generated.")
        
    return alerts

def calculate_metrics(db):
    print("Calculating dashboard metrics...")
    alerts = list(db.alerts.find())
    
    severity_counts = {}
    top_techniques = {}
    
    for alert in alerts:
        sev = alert.get("severity", "UNKNOWN").upper()
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        
        mitre_info = alert.get("mitre_enrichment", {})
        tech_id = mitre_info.get("technique_id")
        if tech_id:
            top_techniques[tech_id] = top_techniques.get(tech_id, 0) + 1
            
    summary = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "total_alerts": len(alerts),
        "alert_counts_by_severity": severity_counts,
        "top_mitre_techniques": dict(sorted(top_techniques.items(), key=lambda item: item[1], reverse=True)[:5])
    }
    
    db.dashboard_metrics.delete_many({})
    db.dashboard_metrics.insert_one(summary)
    print("Metrics calculated and stored in dashboard_metrics collection.")

def get_mongo_uri():
    uri = os.environ.get("MONGO_URI")
    if uri and "mongodb+srv" not in uri: 
        return uri
        
    env_path = os.path.join(os.path.dirname(__file__), "dashboard", ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("MONGO_URI="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    
    return os.environ.get("MONGO_URI")

def main():
    mongo_uri = get_mongo_uri()
    if not mongo_uri:
        print("Error: MONGO_URI environment variable not set. Exiting.")
        return

    client = MongoClient(mongo_uri)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["siem_db"]

    print("Connected to MongoDB.")

    clear_raw_logs(db)
    generate_logs(db)
    evaluate_rules_and_enrich(db)
    calculate_metrics(db)

    print("Pipeline execution completed.")

if __name__ == "__main__":
    main()
