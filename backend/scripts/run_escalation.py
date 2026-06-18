import os
import sys

# Add workspace root directory to Python path
workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(workspace_root)

from backend.app.database import SessionLocal
from backend import main

def main_run():
    print("Starting automatic Naarad-GRS Escalation Engine...")
    db = SessionLocal()
    try:
        main.auto_escalate_grievances(db)
        print("Escalation engine run completed successfully.")
    except Exception as e:
        print(f"Error executing escalation engine: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main_run()
