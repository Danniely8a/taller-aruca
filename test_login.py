import urllib.request, json

# Test login
data = json.dumps({"correo": "alberto@aruca.com", "contrasena": "123456"}).encode()
req = urllib.request.Request(
    "https://taller-aruca.vercel.app/api/auth/login",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    resp = urllib.request.urlopen(req)
    print("Status:", resp.status)
    print("Body:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("Status:", e.code)
    print("Body:", e.read().decode())
