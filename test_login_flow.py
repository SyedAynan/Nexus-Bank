import requests

def test_login():
    print("Testing Login Flow...")
    
    # 1. Login Request
    login_data = {
        "username": "admin",
        "password": "admin"
    }
    
    # Needs to be form data, not json
    try:
        r = requests.post("http://localhost:8000/api/auth/login", data=login_data)
        print(f"Login Response: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    test_login()
