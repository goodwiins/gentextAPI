#!/usr/bin/env python3
"""
Simple test script to verify analytics endpoints are working
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_homepage_metrics():
    """Test POST /analytics/homepage/metrics"""
    url = f"{BASE_URL}/analytics/homepage/metrics"
    
    payload = {
        "sessionId": "sess_test123",
        "userId": "user_test456",
        "timestamp": datetime.now().isoformat() + "Z",
        "pageView": {
            "loadTime": 2450,
            "lcp": 1800,
            "fcp": 1200,
            "cls": 0.05,
            "fid": 85
        },
        "userAgent": "Mozilla/5.0 (Test Browser)",
        "viewport": {
            "width": 1920,
            "height": 1080
        },
        "referrer": "https://google.com"
    }
    
    print("Testing POST /analytics/homepage/metrics...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 201
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_conversion_events():
    """Test POST /analytics/homepage/conversions"""
    url = f"{BASE_URL}/analytics/homepage/conversions"
    
    payload = {
        "sessionId": "sess_test123",
        "userId": "user_test456",
        "eventType": "signup_clicked",
        "eventData": {
            "ctaText": "Get Started",
            "ctaPosition": "hero",
            "scrollDepth": 25,
            "timeOnPage": 45000
        },
        "timestamp": datetime.now().isoformat() + "Z",
        "successful": True
    }
    
    print("\nTesting POST /analytics/homepage/conversions...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 201
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_feature_engagement():
    """Test POST /analytics/homepage/engagement"""
    url = f"{BASE_URL}/analytics/homepage/engagement"
    
    payload = {
        "sessionId": "sess_test123",
        "sectionName": "features",
        "engagementType": "complete_view",
        "duration": 12000,
        "scrollDepth": 100,
        "interactions": 3,
        "timestamp": datetime.now().isoformat() + "Z"
    }
    
    print("\nTesting POST /analytics/homepage/engagement...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 201
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_analytics_summary():
    """Test GET /analytics/homepage/summary"""
    url = f"{BASE_URL}/analytics/homepage/summary"
    
    print("\nTesting GET /analytics/homepage/summary...")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_health_check():
    """Test analytics health check"""
    url = f"{BASE_URL}/analytics/health"
    
    print("\nTesting GET /analytics/health...")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Analytics Endpoints")
    print("=" * 50)
    
    tests = [
        test_health_check,
        test_homepage_metrics,
        test_conversion_events,
        test_feature_engagement,
        test_analytics_summary
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 50)
    print(f"✅ Tests passed: {sum(results)}/{len(results)}")
    
    if all(results):
        print("🎉 All analytics endpoints are working correctly!")
    else:
        print("❌ Some tests failed. Check the server logs.")

if __name__ == "__main__":
    main()