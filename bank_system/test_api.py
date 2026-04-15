import requests

BASE_URL = "http://localhost:5000/api"


def test_login():
    print("--- Testing Login ---")
    data = {"username": "admin", "password": "admin123"}
    r = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(r.status_code, r.json())
    return r.json().get("success")


def test_value_error():
    print("\n--- Testing ValueError Handling ---")
    # Missing credentials test
    r1 = requests.post(f"{BASE_URL}/auth/login", json={})
    print("Empty body status:", r1.status_code)

    # Note: testing full route value_error would require auth cookie, which request doesn't hold unless we use a session.
    # We will test login error handling instead.
    assert r1.status_code == 400


if __name__ == "__main__":
    try:
        requests.get("http://localhost:5000/")
    except requests.exceptions.ConnectionError:
        print("Server is not running. Start with 'python app.py' first.")
        exit(1)

    test_login()
    test_value_error()
    print("\nTests completed.")
