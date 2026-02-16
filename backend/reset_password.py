import sys
import os

# Add current directory to path so we can import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
import models
import auth
from database import SessionLocal, engine

def reset_password(username, new_password):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            print(f"Error: User '{username}' not found.")
            return False

        hashed_password = auth.get_password_hash(new_password)
        user.hashed_password = hashed_password
        db.commit()
        print(f"Successfully updated password for user '{username}'.")
        return True
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py <username> <new_password>")
        sys.exit(1)

    username = sys.argv[1]
    new_password = sys.argv[2]

    if reset_password(username, new_password):
        sys.exit(0)
    else:
        sys.exit(1)
