import sys
import secrets
from app.database import SessionLocal, ApiKey

def create_api_key(name: str):
    db = SessionLocal()
    try:
        key = f"brymix_{secrets.token_urlsafe(32)}"
        api_key = ApiKey(key=key, name=name)
        db.add(api_key)
        db.commit()
        print(f"Created API key: {key[:12]}...{key[-4:]}")
        print(f"Name: {name}")
        print(f"Full key (copy now): {key}")
        print("WARNING: Store this key securely. It won't be shown again.")
        return key
    finally:
        db.close()

def list_api_keys():
    db = SessionLocal()
    try:
        keys = db.query(ApiKey).all()
        print("API Keys:")
        print("-" * 60)
        for key in keys:
            status = "ACTIVE" if key.active else "INACTIVE"
            masked_key = f"{key.key[:12]}...{key.key[-4:]}"
            print(f"{key.name}: {masked_key} [{status}]")
    finally:
        db.close()

def deactivate_key(key: str):
    db = SessionLocal()
    try:
        api_key = db.query(ApiKey).filter(ApiKey.key == key).first()
        if api_key:
            api_key.active = False
            db.commit()
            masked_key = f"{key[:12]}...{key[-4:]}"
            print(f"Deactivated key: {masked_key}")
        else:
            print("Key not found")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python manage_keys.py create <name>")
        print("  python manage_keys.py list")
        print("  python manage_keys.py deactivate <key>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "create" and len(sys.argv) == 3:
        create_api_key(sys.argv[2])
    elif command == "list":
        list_api_keys()
    elif command == "deactivate" and len(sys.argv) == 3:
        deactivate_key(sys.argv[2])
    else:
        print("Invalid command or arguments")