import requests

url = "http://localhost:8000/api/auth/register"
payload = {
    "username": "admin",
    "email": "admin@bank.com",
    "password": "admin",
    "role": "admin"
}

try:
    response = requests.post(url, json=payload)
    print(response.status_code, response.text)
except Exception as e:
    print("Error:", e)
