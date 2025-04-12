import requests

if __name__ == "__main__":
    response = requests.get("http://127.0.0.1:8000/api/health")
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
