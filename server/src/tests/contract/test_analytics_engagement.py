"""
Contract test for POST /analytics/homepage/engagement endpoint
Tests the OpenAPI specification compliance for feature engagement tracking
"""

import pytest
import requests
import json
from datetime import datetime
from typing import Dict, Any


class TestAnalyticsEngagementContract:
    """Test cases for POST /analytics/homepage/engagement endpoint contract compliance"""
    
    BASE_URL = "http://localhost:8000"
    ENDPOINT = "/analytics/homepage/engagement"
    
    def setup_method(self):
        """Setup test fixtures"""
        self.valid_payload = {
            "sessionId": "sess_abc123def456",
            "sectionName": "features",
            "engagementType": "complete_view",
            "duration": 12000,
            "scrollDepth": 100,
            "interactions": 3
        }
    
    def test_post_valid_engagement_returns_201(self):
        """
        GIVEN a valid feature engagement payload
        WHEN POST request is sent to /analytics/homepage/engagement
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
    
    def test_post_all_section_names_return_201(self):
        """
        GIVEN valid payloads for all section names
        WHEN POST requests are sent to /analytics/homepage/engagement
        THEN all responses should have status 201
        """
        section_names = [
            "hero",
            "features", 
            "testimonials",
            "how-it-works",
            "cta",
            "footer"
        ]
        
        for section in section_names:
            payload = self.valid_payload.copy()
            payload["sectionName"] = section
            
            response = requests.post(
                f"{self.BASE_URL}{self.ENDPOINT}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 201, f"Expected 201 for section {section}, got {response.status_code}"
    
    def test_post_all_engagement_types_return_201(self):
        """
        GIVEN valid payloads for all engagement types
        WHEN POST requests are sent to /analytics/homepage/engagement
        THEN all responses should have status 201
        """
        engagement_types = ["view", "interact", "complete_view"]
        
        for engagement_type in engagement_types:
            payload = self.valid_payload.copy()
            payload["engagementType"] = engagement_type
            
            response = requests.post(
                f"{self.BASE_URL}{self.ENDPOINT}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == 201, f"Expected 201 for engagement {engagement_type}, got {response.status_code}"
    
    def test_post_missing_required_fields_returns_400(self):
        """
        GIVEN a payload missing required fields
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 400
        """
        invalid_payload = {
            "sessionId": "sess_abc123def456"
            # Missing required fields: sectionName, engagementType, duration, scrollDepth, interactions
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
    
    def test_post_invalid_section_name_returns_400(self):
        """
        GIVEN a payload with invalid sectionName
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["sectionName"] = "invalid_section"
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_engagement_type_returns_400(self):
        """
        GIVEN a payload with invalid engagementType
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["engagementType"] = "invalid_engagement"
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_duration_returns_400(self):
        """
        GIVEN a payload with invalid duration (exceeds 300000ms / 5 min limit)
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["duration"] = 400000  # Exceeds 300000ms limit
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_negative_duration_returns_400(self):
        """
        GIVEN a payload with negative duration
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["duration"] = -100
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_invalid_scroll_depth_returns_400(self):
        """
        GIVEN a payload with invalid scrollDepth (outside 0-100 range)
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["scrollDepth"] = 150  # Above 100
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_negative_interactions_returns_400(self):
        """
        GIVEN a payload with negative interactions count
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 400
        """
        invalid_payload = self.valid_payload.copy()
        invalid_payload["interactions"] = -1
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=invalid_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_post_zero_values_returns_201(self):
        """
        GIVEN a payload with zero values for duration, scrollDepth, interactions
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 201
        """
        zero_payload = self.valid_payload.copy()
        zero_payload["duration"] = 0
        zero_payload["scrollDepth"] = 0
        zero_payload["interactions"] = 0
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=zero_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    
    def test_post_maximum_values_returns_201(self):
        """
        GIVEN a payload with maximum allowed values
        WHEN POST request is sent to /analytics/homepage/engagement
        THEN response status should be 201
        """
        max_payload = self.valid_payload.copy()
        max_payload["duration"] = 300000  # 5 minutes
        max_payload["scrollDepth"] = 100
        max_payload["interactions"] = 999  # High but reasonable
        
        response = requests.post(
            f"{self.BASE_URL}{self.ENDPOINT}",
            json=max_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    
    def test_post_invalid_session_id_format_returns_400(self):
        """
        GIVEN a payload with invalid sessionId format (exceeds 128 chars)
        WHEN POST request is sent to /analytics/homepage/engagement
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