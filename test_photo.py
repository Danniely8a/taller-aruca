import urllib.request, json

data = json.dumps({"correo":"alberto@aruca.com","contrasena":"123456"}).encode()
req = urllib.request.Request("https://taller-aruca.vercel.app/api/auth/login", data=data, headers={"Content-Type":"application/json"}, method="POST")
resp = urllib.request.urlopen(req)
session_cookie = resp.headers.get("Set-Cookie", "").split(";")[0]
body = resp.read().decode()
print("Login:", body[:80])

# Try upload with a small test image
import io
# Create minimal valid PNG
png_data = bytes([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
])

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body_parts = []
body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="foto"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n'.encode())
body_parts.append(png_data)
body_parts.append(f'\r\n--{boundary}--\r\n'.encode())
body = b''.join(body_parts)

req2 = urllib.request.Request(
    "https://taller-aruca.vercel.app/api/photos/1",
    data=body,
    headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Cookie": session_cookie
    },
    method="POST"
)
try:
    resp2 = urllib.request.urlopen(req2)
    print("Upload:", resp2.status, resp2.read().decode()[:200])
except urllib.error.HTTPError as e:
    print("Upload error:", e.code, e.read().decode()[:500])
