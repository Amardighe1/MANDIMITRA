"""End-to-end test for crop disease analysis."""
import requests
import json

BASE = "http://localhost:8000"

# Register a test farmer (will fail if already exists, that's fine)
signup_r = requests.post(f"{BASE}/api/auth/signup", json={
    "email": "testfarmer@test.com",
    "password": "test1234",
    "full_name": "Test Farmer",
    "phone": "9999999999",
    "role": "farmer",
})
print(f"Signup status: {signup_r.status_code} - {signup_r.text[:100]}")

# Login as farmer
login_r = requests.post(f"{BASE}/api/auth/login", json={
    "email": "testfarmer@test.com",
    "password": "test1234",
    "role": "farmer",
})
print(f"Login status: {login_r.status_code}")
data = login_r.json()
token = data.get("access_token", "")
print(f"Token: {token[:20]}..." if token else "No token")
user = data.get("user", {})
print(f"Role: {user.get('role', 'unknown')}")

if not token:
    print("Login failed, cannot test analyze endpoint")
    exit(1)

# Test analyze with a Corn Common Rust image
test_image = "d:/mandimitra/Crop Diseases/Corn___Common_Rust/image (1).JPG"
with open(test_image, "rb") as f:
    r = requests.post(
        f"{BASE}/api/crop-disease/analyze",
        files={"file": ("test.jpg", f, "image/jpeg")},
        headers={"Authorization": f"Bearer {token}"},
    )

print(f"\nAnalyze status: {r.status_code}")
result = r.json()
print(f"Crop: {result.get('crop')}")
print(f"Disease: {result.get('disease')}")
print(f"Healthy: {result.get('is_healthy')}")
print(f"Confidence: {result.get('confidence')}%")
print(f"Top predictions:")
for p in result.get("top_predictions", []):
    print(f"  {p['class']}: {p['confidence']}%")
print(f"Advice status: {result.get('advice', {}).get('status')}")
print(f"Advice summary: {result.get('advice', {}).get('summary', '')[:100]}")
print(f"Model accuracy: {result.get('model_accuracy')}%")

# Test with a healthy crop image
import glob
healthy_images = glob.glob("d:/mandimitra/Crop Diseases/Wheat___Healthy/*")
if healthy_images:
    with open(healthy_images[0], "rb") as f:
        r2 = requests.post(
            f"{BASE}/api/crop-disease/analyze",
            files={"file": ("test2.jpg", f, "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"},
        )
    result2 = r2.json()
    print(f"\n--- Healthy crop test ---")
    print(f"Crop: {result2.get('crop')}")
    print(f"Disease: {result2.get('disease')}")
    print(f"Healthy: {result2.get('is_healthy')}")
    print(f"Confidence: {result2.get('confidence')}%")
    print(f"Advice status: {result2.get('advice', {}).get('status')}")
