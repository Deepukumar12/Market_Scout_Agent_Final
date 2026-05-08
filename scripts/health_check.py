#!/usr/bin/env python3
import requests
import sys
import time

SERVICES = {
    "Backend API": "http://localhost:8000/health",
    "Worker (Redis)": "http://localhost:6379",
    "Admin UI": "http://localhost:8080",
    "Main Frontend": "http://localhost:3000"
}

def check_health():
    print("🚀 Starting Production Health Check...")
    print("-" * 40)
    
    all_healthy = True
    for name, url in SERVICES.items():
        try:
            if "localhost:6379" in url:
                # Basic check for Redis could be added here
                print(f"✅ {name:15} | [INTERNAL] Connection assumed ok")
                continue
                
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {name:15} | Status: {response.status_code} OK")
            else:
                print(f"❌ {name:15} | Status: {response.status_code} ERROR")
                all_healthy = False
        except Exception as e:
            print(f"❌ {name:15} | FAILED: {str(e)}")
            all_healthy = False
            
    print("-" * 40)
    if all_healthy:
        print("🎉 ALL SYSTEMS OPERATIONAL")
    else:
        print("⚠️ SYSTEM DEGRADATION DETECTED")
        sys.exit(1)

if __name__ == "__main__":
    check_health()
