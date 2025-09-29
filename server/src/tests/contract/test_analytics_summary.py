"""
Contract test for GET /analytics/homepage/summary endpoint
Tests the OpenAPI specification compliance for analytics summary retrieval
"""

import pytest
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any


class TestAnalyticsSummaryContract:
    """Test cases for GET /analytics/homepage/summary endpoint contract compliance"""
    
    BASE_URL = "http://localhost:8000"
    ENDPOINT = "/analytics/homepage/summary"
    
    def test_get_summary_without_params_returns_200(self):
        """
        GIVEN no query parameters
        WHEN GET request is sent to /analytics/homepage/summary
        THEN response status should be 200
        AND response should contain AnalyticsSummary schema
        """
        # This test MUST fail until the endpoint is implemented
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}")
        
        # Contract assertions
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        response_data = response.json()
        
        # Validate AnalyticsSummary schema structure
        assert "dateRange" in response_data, "Response missing 'dateRange' field"
        assert "totalPageViews" in response_data, "Response missing 'totalPageViews' field"
        assert "uniqueVisitors" in response_data, "Response missing 'uniqueVisitors' field"
        assert "averageLoadTime" in response_data, "Response missing 'averageLoadTime' field"
        assert "conversionRate" in response_data, "Response missing 'conversionRate' field"
        assert "topConversionEvents" in response_data, "Response missing 'topConversionEvents' field"
        assert "performanceMetrics" in response_data, "Response missing 'performanceMetrics' field"
        assert "sectionEngagement" in response_data, "Response missing 'sectionEngagement' field"
        
        # Validate dateRange structure
        date_range = response_data["dateRange"]
        assert "from" in date_range, "dateRange missing 'from' field"
        assert "to" in date_range, "dateRange missing 'to' field"
        
        # Validate data types
        assert isinstance(response_data["totalPageViews"], int), "totalPageViews should be integer"
        assert isinstance(response_data["uniqueVisitors"], int), "uniqueVisitors should be integer"
        assert isinstance(response_data["averageLoadTime"], (int, float)), "averageLoadTime should be number"
        assert isinstance(response_data["conversionRate"], (int, float)), "conversionRate should be number"
        assert isinstance(response_data["topConversionEvents"], list), "topConversionEvents should be list"
        assert isinstance(response_data["sectionEngagement"], list), "sectionEngagement should be list"
    
    def test_get_summary_with_date_range_returns_200(self):
        """
        GIVEN valid dateFrom and dateTo parameters
        WHEN GET request is sent to /analytics/homepage/summary
        THEN response status should be 200
        """
        params = {
            "dateFrom": "2025-01-01",
            "dateTo": "2025-01-28"
        }
        
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}", params=params)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        response_data = response.json()
        
        # Validate that returned dateRange matches requested range
        date_range = response_data["dateRange"]
        assert date_range["from"] == params["dateFrom"], "Returned dateFrom doesn't match requested"
        assert date_range["to"] == params["dateTo"], "Returned dateTo doesn't match requested"
    
    def test_get_summary_with_group_by_day_returns_200(self):
        """
        GIVEN groupBy parameter set to 'day'
        WHEN GET request is sent to /analytics/homepage/summary
        THEN response status should be 200
        """
        params = {"groupBy": "day"}
        
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}", params=params)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_get_summary_with_all_group_by_options_returns_200(self):
        """
        GIVEN all valid groupBy parameter values
        WHEN GET requests are sent to /analytics/homepage/summary
        THEN all responses should have status 200
        """
        group_by_options = ["hour", "day", "week", "month"]
        
        for group_by in group_by_options:
            params = {"groupBy": group_by}
            
            response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}", params=params)
            
            assert response.status_code == 200, f"Expected 200 for groupBy {group_by}, got {response.status_code}"
    
    def test_get_summary_with_invalid_date_format_returns_400(self):
        """
        GIVEN invalid date format in dateFrom parameter
        WHEN GET request is sent to /analytics/homepage/summary
        THEN response status should be 400
        """
        params = {"dateFrom": "invalid-date-format"}
        
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}", params=params)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        error_data = response.json()
        
        # Validate ErrorResponse schema
        assert "error" in error_data, "Response missing 'error' field"
        assert "message" in error_data, "Response missing 'message' field"
        assert "timestamp" in error_data, "Response missing 'timestamp' field"
    
    def test_get_summary_with_invalid_group_by_returns_400(self):
        """
        GIVEN invalid groupBy parameter value
        WHEN GET request is sent to /analytics/homepage/summary
        THEN response status should be 400
        """
        params = {"groupBy": "invalid_group_by"}
        
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}", params=params)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_get_summary_with_date_to_before_date_from_returns_400(self):
        """
        GIVEN dateTo before dateFrom
        WHEN GET request is sent to /analytics/homepage/summary
        THEN response status should be 400
        """
        params = {
            "dateFrom": "2025-01-28",
            "dateTo": "2025-01-01"  # Before dateFrom
        }
        
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}", params=params)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_get_summary_performance_metrics_structure(self):
        """
        GIVEN a successful request
        WHEN GET request is sent to /analytics/homepage/summary
        THEN performanceMetrics should have correct structure
        """
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        response_data = response.json()
        performance_metrics = response_data["performanceMetrics"]
        
        # Validate performanceMetrics structure
        assert "averageLCP" in performance_metrics, "performanceMetrics missing 'averageLCP'"
        assert "averageFCP" in performance_metrics, "performanceMetrics missing 'averageFCP'"
        assert "averageCLS" in performance_metrics, "performanceMetrics missing 'averageCLS'"
        assert "averageFID" in performance_metrics, "performanceMetrics missing 'averageFID'"
        
        # Validate data types
        assert isinstance(performance_metrics["averageLCP"], (int, float)), "averageLCP should be number"
        assert isinstance(performance_metrics["averageFCP"], (int, float)), "averageFCP should be number"
        assert isinstance(performance_metrics["averageCLS"], (int, float)), "averageCLS should be number"
        assert isinstance(performance_metrics["averageFID"], (int, float)), "averageFID should be number"
    
    def test_get_summary_top_conversion_events_structure(self):
        """
        GIVEN a successful request
        WHEN GET request is sent to /analytics/homepage/summary
        THEN topConversionEvents should have correct structure
        """
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        response_data = response.json()
        top_conversion_events = response_data["topConversionEvents"]
        
        # If there are conversion events, validate structure
        if len(top_conversion_events) > 0:
            event = top_conversion_events[0]
            
            assert "eventType" in event, "Conversion event missing 'eventType'"
            assert "count" in event, "Conversion event missing 'count'"
            assert "conversionRate" in event, "Conversion event missing 'conversionRate'"
            
            # Validate data types
            assert isinstance(event["eventType"], str), "eventType should be string"
            assert isinstance(event["count"], int), "count should be integer"
            assert isinstance(event["conversionRate"], (int, float)), "conversionRate should be number"
    
    def test_get_summary_section_engagement_structure(self):
        """
        GIVEN a successful request
        WHEN GET request is sent to /analytics/homepage/summary
        THEN sectionEngagement should have correct structure
        """
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        response_data = response.json()
        section_engagement = response_data["sectionEngagement"]
        
        # If there are engagement records, validate structure
        if len(section_engagement) > 0:
            engagement = section_engagement[0]
            
            assert "sectionName" in engagement, "Section engagement missing 'sectionName'"
            assert "viewRate" in engagement, "Section engagement missing 'viewRate'"
            assert "averageDuration" in engagement, "Section engagement missing 'averageDuration'"
            assert "interactionRate" in engagement, "Section engagement missing 'interactionRate'"
            
            # Validate data types
            assert isinstance(engagement["sectionName"], str), "sectionName should be string"
            assert isinstance(engagement["viewRate"], (int, float)), "viewRate should be number"
            assert isinstance(engagement["averageDuration"], (int, float)), "averageDuration should be number"
            assert isinstance(engagement["interactionRate"], (int, float)), "interactionRate should be number"
    
    def test_get_summary_with_all_parameters_returns_200(self):
        """
        GIVEN all valid query parameters
        WHEN GET request is sent to /analytics/homepage/summary
        THEN response status should be 200
        """
        params = {
            "dateFrom": "2025-01-01",
            "dateTo": "2025-01-28",
            "groupBy": "week"
        }
        
        response = requests.get(f"{self.BASE_URL}{self.ENDPOINT}", params=params)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


if __name__ == "__main__":
    # Run this test file directly to verify contract compliance
    pytest.main([__file__, "-v"])