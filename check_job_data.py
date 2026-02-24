from app.database import SessionLocal, Job
import json

db = SessionLocal()
job = db.query(Job).filter(Job.id == "job_8a96cc28256c").first()

if job and job.result:
    result = json.loads(job.result)
    print(json.dumps(result.get("metrics"), indent=2))
else:
    print("Job not found")

db.close()
