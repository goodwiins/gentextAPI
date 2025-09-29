"""
Contract test for POST /analytics/homepage/conversions endpoint
Tests the OpenAPI specification compliance for conversion events tracking
"""

import pytest
import requests
import json
from datetime import datetime
from typing import Dict, Any


class TestAnalyticsConversionsContract:
    """Test cases for POST /analytics/homepage/conversions endpoint contract compliance"""
    
    BASE_URL = "http://localhost:8000"
    ENDPOINT = "/analytics/homepage/conversions"
    
    def setup_method(self):
        """Setup test fixtures"""
        self.valid_payload = {
            "sessionId": "sess_abc123def456",
            "userId": None,
            "eventType": "signup_clicked",
            "eventData": {
                "ctaText": "Get Started",
                "ctaPosition": "hero",
                "scrollDepth": 25,
                "timeOnPage": 45000
            },
            "successful": True
        }
    
    def test_post_valid_conversion_returns_201(self):
        """
        GIVEN a valid conversion event payload
        WHEN POST request is sent to /analytics/homepage/conversions
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
    
    def test_post_all_conversion_types_return_201(self):
        """
        GIVEN valid payloads for all conversion event types
        WHEN POST requests are sent to /analytics/homepage/conversions
        THEN all responses should have status 201
        """
        conversion_types = [
            "signup_clicked",
            "login_clicked", 
            "generate_clicked",
            "learn_more_clicked",
            "contact_clicked"
        ]
        
        for event_type in conversion_types:
            payload = self.valid_payload.copy()
            payload["eventType"] = event_type
            
            response = requests.post(
                f"{self.BASE_URL}{self.ENDPOINT}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 201, f"Expected 201 for {event_type}, got {response.status_code}"
    
    def test_post_all_cta_positions_return_201(self):
        """
        GIVEN valid payloads for all CTA positions
        WHEN POST requests are sent to /analytics/homepage/conversions
        THEN all responses should have status 201
        """
        cta_positions = ["hero", "features", "how-it-works", "testimonials", "footer"]
        
        for position in cta_positions:
            payload = self.valid_payload.copy()
            payload["eventData"]["ctaPosition"] = position
            
            response = requests.post(
                f"{self.BASE_URL}{self.ENDPOINT}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 201, f"Expected 201 for position {position}, got {response.status_code}"
    
    def test_post_missing_required_fields_returns_400(self):
        """
        GIVEN a payload missing required fields
        WHEN POST request is sent to /analytics/homepage/conversions
        THEN response status should be 400
        """
        invalid_payload = {
            "sessionId": "sess_abc123def456"
            # Missing required fields: eventType, eventData, successful
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
    
    def test_post_invalid_event_type_returns_400(self):
        """
        GIVEN a payload with invalid eventType
        WHEN POST request is sent to /analytics/homepage/conversions
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["eventType"] = "invalid_event_type"
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_scroll_depth_returns_400(self):
        """
        GIVEN a payload with invalid scrollDepth (outside 0-100 range)
        WHEN POST request is sent to /analytics/homepage/conversions
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["eventData"]["scrollDepth"] = 150  # Above 100
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_cta_text_length_returns_400(self):
        """
        GIVEN a payload with ctaText exceeding 100 chars
        WHEN POST request is sent to /analytics/homepage/conversions
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["eventData"]["ctaText"] = "x" * 101  # Exceeds 100 char limit
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_negative_time_on_page_returns_400(self):
        """
        GIVEN a payload with negative timeOnPage
        WHEN POST request is sent to /analytics/homepage/conversions
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["eventData"]["timeOnPage"] = -100
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_with_error_message_returns_201(self):
        """
        GIVEN a payload with errorMessage for failed conversion
        WHEN POST request is sent to /analytics/homepage/conversions
        THEN response status should be 201
        """
        payload_with_error = self.valid_payload.copy()
        payload_with_error["successful"] = False
        payload_with_error["errorMessage"] = "Navigation failed"
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=payload_with_error,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    
    def test_post_with_authenticated_user_returns_201(self):
        """
        GIVEN a payload with authenticated userId
        WHEN POST request is sent to /analytics/homepage/conversions
        THEN response status should be 201
        """
        payload_with_user = self.valid_payload.copy()
        payload_with_user["userId"] = "user_authenticated_123"
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=payload_with_user,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    
    def test_post_invalid_session_id_format_returns_400(self):
        """
        GIVEN a payload with invalid sessionId format (exceeds 128 chars)
        WHEN POST request is sent to /analytics/homepage/conversions
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


if __name__ == "__main__":
    # Run this test file directly to verify contract compliance
    pytest.main([__file__, "-v"])