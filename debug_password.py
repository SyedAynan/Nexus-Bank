"""Debug script to verify password hashing and check the admin user."""
import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Connect to the database
conn = sqlite3.connect("nexa_dev.db")
cur = conn.cursor()

# Get admin user
cur.execute("SELECT id, username, hashed_password, mfa_enabled, is_locked, failed_login_attempts FROM users WHERE username='admin'")
row = cur.fetchone()

if row:
    user_id, username, hashed_password, mfa_enabled, is_locked, failed_attempts = row
    print(f"User found: {username} (id={user_id})")
    print(f"  hashed_password: {hashed_password}")
    print(f"  mfa_enabled: {mfa_enabled}")
    print(f"  is_locked: {is_locked}")
    print(f"  failed_attempts: {failed_attempts}")
    print()
    
    # Verify passwords
    try:
        result_admin123 = pwd_context.verify("admin123", hashed_password)
        print(f"  'admin123' matches: {result_admin123}")
    except Exception as e:
        print(f"  'admin123' verification error: {e}")
    
    try:
        result_admin = pwd_context.verify("admin", hashed_password)
        print(f"  'admin' matches: {result_admin}")
    except Exception as e:
        print(f"  'admin' verification error: {e}")

    # Generate a fresh hash for admin123 and verify it works
    print()
    fresh_hash = pwd_context.hash("admin123")
    print(f"  Fresh hash for 'admin123': {fresh_hash}")
    print(f"  Fresh hash verifies: {pwd_context.verify('admin123', fresh_hash)}")
else:
    print("Admin user NOT FOUND in database!")

conn.close()
