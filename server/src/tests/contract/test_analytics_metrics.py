"""
Contract test for POST /analytics/homepage/metrics endpoint
Tests the OpenAPI specification compliance for homepage metrics tracking
"""

import pytest
import requests
import json
from datetime import datetime
from typing import Dict, Any


class TestAnalyticsMetricsContract:
    """Test cases for POST /analytics/homepage/metrics endpoint contract compliance"""
    
    BASE_URL = "http://localhost:8000"
    ENDPOINT = "/analytics/homepage/metrics"
    
    def setup_method(self):
        """Setup test fixtures"""
        self.valid_payload = {
            "sessionId": "sess_abc123def456",
            "userId": "user_789xyz",
            "pageView": {
                "loadTime": 2450,
                "lcp": 1800,
                "fcp": 1200,
                "cls": 0.05,
                "fid": 85
            },
            "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "viewport": {
                "width": 1920,
                "height": 1080
            },
            "referrer": "https://google.com"
        }
    
    def test_post_valid_metrics_returns_201(self):
        """
        GIVEN a valid homepage metrics payload
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 201
        AND response should contain AnalyticsResponse schema
        """
        # This test MUST fail until the endpoint is implemented
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=self.valid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Contract assertions
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        response_data = response.json()
        
        # Validate AnalyticsResponse schema
        assert "id" in response_data, "Response missing 'id' field"
        assert "status" in response_data, "Response missing 'status' field"
        assert "timestamp" in response_data, "Response missing 'timestamp' field"
        
        assert response_data["status"] == "success", "Expected status 'success'"
        assert isinstance(response_data["id"], str), "ID should be string"
        assert isinstance(response_data["timestamp"], str), "Timestamp should be string"
    
    def test_post_missing_required_fields_returns_400(self):
        """
        GIVEN a payload missing required fields
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 400
        AND response should contain ErrorResponse schema
        """
        invalid_payload = {
            "sessionId": "sess_abc123def456"
            # Missing required fields: pageView, userAgent, viewport
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        error_data = response.json()
        
        # Validate ErrorResponse schema
        assert "error" in error_data, "Response missing 'error' field"
        assert "message" in error_data, "Response missing 'message' field"
        assert "timestamp" in error_data, "Response missing 'timestamp' field"
    
    def test_post_invalid_session_id_format_returns_400(self):
        """
        GIVEN a payload with invalid sessionId format (exceeds 128 chars)
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["sessionId"] = "x" * 129  # Exceeds 128 char limit
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_load_time_returns_400(self):
        """
        GIVEN a payload with invalid loadTime (exceeds 30000ms limit)
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["pageView"]["loadTime"] = 35000  # Exceeds 30000ms limit
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_lcp_returns_400(self):
        """
        GIVEN a payload with invalid LCP (exceeds 10000ms limit)
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["pageView"]["lcp"] = 15000  # Exceeds 10000ms limit
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_user_agent_length_returns_400(self):
        """
        GIVEN a payload with userAgent exceeding 512 chars
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["userAgent"] = "x" * 513  # Exceeds 512 char limit
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_viewport_dimensions_returns_400(self):
        """
        GIVEN a payload with invalid viewport dimensions
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["viewport"]["width"] = 100  # Below 320px minimum
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_without_optional_fields_returns_201(self):
        """
        GIVEN a payload without optional fields (userId, referrer)
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 201
        """
        payload_without_optional = {
            "sessionId": "sess_abc123def456",
            "pageView": {
                "loadTime": 2450,
                "lcp": 1800,
                "fcp": 1200,
                "cls": 0.05,
                "fid": 85
            },
            "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "viewport": {
                "width": 1920,
                "height": 1080
            }
            # Optional fields: userId, referrer omitted
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=payload_without_optional,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    
    def test_post_invalid_content_type_returns_400(self):
        """
        GIVEN a request with invalid Content-Type
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 400
        """
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            data=json.dumps(self.valid_payload),
            headers={"Content-Type": "text/plain"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_malformed_json_returns_400(self):
        """
        GIVEN a request with malformed JSON
        WHEN POST request is sent to /analytics/homepage/metrics
        THEN response status should be 400
        """
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            data="{ invalid json }",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


if __name__ == "__main__":
    # Run this test file directly to verify contract compliance
    pytest.main([__file__, "-v"])