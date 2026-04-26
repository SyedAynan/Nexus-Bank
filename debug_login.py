"""Debug script to test the actual login flow end-to-end."""
import requests

# Test login via form-data (as OAuth2PasswordRequestForm expects)
url = "http://localhost:8000/api/auth/login"
data = {
    "username": "admin",
    "password": "admin123",
}

print("=== Test 1: Login with form-data (correct) ===")
try:
    res = requests.post(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Error: {e}")

print()
print("=== Test 2: Login with JSON (incorrect for OAuth2) ===")
try:
    res = requests.post(url, json=data)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Error: {e}")
