"""
Update existing jobs in database to add currency field
"""

from app.database import SessionLocal, Job
import json

def update_jobs_with_currency():
    db = SessionLocal()
    try:
        jobs = db.query(Job).all()
        print(f"Found {len(jobs)} jobs in database")
        
        updated = 0
        for job in jobs:
            if job.result:
                try:
                    result = json.loads(job.result)
                    
                    if "metrics" in result:
                        # Check violations for currency hints
                        currency = "USD"
                        if "violations" in result:
                            for v in result["violations"]:
                                desc = v.get("description", "")
                                if "NGN" in desc:
                                    currency = "NGN"
                                    break
                        
                        old_currency = result["metrics"].get("currency", "None")
                        result["metrics"]["currency"] = currency
                        job.result = json.dumps(result)
                        updated += 1
                        print(f"Job {job.id}: {old_currency} → {currency}")
                except json.JSONDecodeError:
                    print(f"Failed to parse result for job {job.id}")
        
        db.commit()
        print(f"\n✅ Updated {updated} jobs with currency field")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("UPDATING JOBS WITH CURRENCY FIELD")
    print("=" * 60)
    update_jobs_with_currency()
