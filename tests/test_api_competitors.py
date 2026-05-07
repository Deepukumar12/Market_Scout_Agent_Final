import requests
import jwt
from datetime import datetime, timedelta

# Create a dummy token for one of the users found earlier
# User ID I found earlier: 69c227627d84a9ff47896c19 (from the Atlas DB)
token_data = {
    "sub": "69c227627d84a9ff47896c19",
    "exp": datetime.utcnow() + timedelta(days=1)
}
token = jwt.encode(token_data, "deepu12345", algorithm="HS256")

headers = {
    "Authorization": f"Bearer {token}"
}

print("Testing GET /api/v1/competitors")
res = requests.get("http://localhost:8000/api/v1/competitors", headers=headers)
print("Status:", res.status_code)
print("Response:", res.text)
