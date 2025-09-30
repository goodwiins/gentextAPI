"""
Analytics API Endpoints
FastAPI endpoints for homepage analytics data collection and reporting
"""

from fastapi import APIRouter, HTTPException, Query, Body, BackgroundTasks
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field
import uuid
import logging

from ..config.database import get_database
from ..services.analytics_service import AnalyticsService

# Configure logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/analytics", tags=["analytics"])

# Initialize analytics service
analytics_service = AnalyticsService()

# Pydantic models for request/response
class PageViewMetrics(BaseModel):
    loadTime: float = Field(..., ge=0, le=30000, description="Page load time in milliseconds")
    lcp: float = Field(..., ge=0, le=10000, description="Largest Contentful Paint in milliseconds")
    fcp: float = Field(..., ge=0, le=10000, description="First Contentful Paint in milliseconds")
    cls: float = Field(..., ge=0, le=1, description="Cumulative Layout Shift")
    fid: float = Field(..., ge=0, le=1000, description="First Input Delay in milliseconds")

class ViewportData(BaseModel):
    width: int = Field(..., ge=320, le=5000, description="Viewport width in pixels")
    height: int = Field(..., ge=240, le=5000, description="Viewport height in pixels")

class HomepageMetricsRequest(BaseModel):
    sessionId: str = Field(..., max_length=128, description="Session identifier")
    userId: Optional[str] = Field(None, description="User ID if authenticated")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    pageView: PageViewMetrics
    userAgent: str = Field(..., max_length=512, description="Browser user agent")
    viewport: ViewportData
    referrer: Optional[str] = Field(None, max_length=512, description="Page referrer")

class ConversionEventData(BaseModel):
    ctaText: str = Field(..., max_length=100, description="CTA button text")
    ctaPosition: str = Field(..., description="Position on page")
    scrollDepth: float = Field(..., ge=0, le=100, description="Scroll depth percentage")
    timeOnPage: float = Field(..., ge=0, description="Time spent on page in milliseconds")

class ConversionEventRequest(BaseModel):
    sessionId: str = Field(..., max_length=128, description="Session identifier")
    userId: Optional[str] = Field(None, description="User ID if authenticated")
    eventType: str = Field(..., description="Type of conversion event")
    eventData: ConversionEventData
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    successful: bool = Field(True, description="Whether conversion was successful")
    errorMessage: Optional[str] = Field(None, max_length=512, description="Error message if failed")

class FeatureEngagementRequest(BaseModel):
    sessionId: str = Field(..., max_length=128, description="Session identifier")
    sectionName: str = Field(..., description="Section name")
    engagementType: str = Field(..., description="Type of engagement")
    duration: float = Field(..., gt=0, le=300000, description="Duration in milliseconds")
    scrollDepth: float = Field(..., ge=0, le=100, description="Scroll depth percentage")
    interactions: int = Field(..., ge=0, description="Number of interactions")
    timestamp: str = Field(..., description="ISO 8601 timestamp")

class AnalyticsResponse(BaseModel):
    id: str
    status: str
    message: str
    timestamp: str

class AnalyticsSummaryResponse(BaseModel):
    dateRange: Dict[str, str]
    totalPageViews: int
    uniqueVisitors: int
    averageLoadTime: float
    conversionRate: float
    topConversionEvents: List[Dict[str, Any]]
    performanceMetrics: Dict[str, float]
    sectionEngagement: List[Dict[str, Any]]

# Endpoint: POST /analytics/homepage/metrics
@router.post("/homepage/metrics", response_model=AnalyticsResponse, status_code=201)
async def track_homepage_metrics(
    request: HomepageMetricsRequest,
    background_tasks: BackgroundTasks
):
    """
    Track homepage performance metrics
    Collects Core Web Vitals and page performance data
    """
    try:
        # Validate timestamp format
        try:
            datetime.fromisoformat(request.timestamp.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format")
        
        # Store metrics in background
        background_tasks.add_task(
            analytics_service.store_page_metrics,
            request.dict()
        )
        
        logger.info(f"Stored homepage metrics for session {request.sessionId}")
        
        return AnalyticsResponse(
            id=str(uuid.uuid4()),
            status="success",
            message="Homepage metrics recorded successfully",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error tracking homepage metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record homepage metrics")

# Endpoint: POST /analytics/homepage/conversions
@router.post("/homepage/conversions", response_model=AnalyticsResponse, status_code=201)
async def track_conversion_event(
    request: ConversionEventRequest,
    background_tasks: BackgroundTasks
):
    """
    Track conversion events (CTA clicks, sign-ups, etc.)
    """
    try:
        # Validate event type
        valid_event_types = [
            'signup_clicked', 'login_clicked', 'generate_clicked', 
            'learn_more_clicked', 'contact_clicked'
        ]
        if request.eventType not in valid_event_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid event type. Must be one of: {valid_event_types}"
            )
        
        # Validate CTA position
        valid_cta_positions = ['hero', 'features', 'how-it-works', 'testimonials', 'footer']
        if request.eventData.ctaPosition not in valid_cta_positions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid CTA position. Must be one of: {valid_cta_positions}"
            )
        
        # Validate timestamp
        try:
            datetime.fromisoformat(request.timestamp.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format")
        
        # Store conversion event in background
        background_tasks.add_task(
            analytics_service.store_conversion_event,
            request.dict()
        )
        
        logger.info(f"Stored conversion event {request.eventType} for session {request.sessionId}")
        
        return AnalyticsResponse(
            id=str(uuid.uuid4()),
            status="success",
            message="Conversion event recorded successfully",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking conversion event: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record conversion event")

# Endpoint: POST /analytics/homepage/engagement
@router.post("/homepage/engagement", response_model=AnalyticsResponse, status_code=201)
async def track_feature_engagement(
    request: FeatureEngagementRequest,
    background_tasks: BackgroundTasks
):
    """
    Track feature engagement (section views, interactions, etc.)
    """
    try:
        # Validate section name
        valid_sections = ['hero', 'features', 'testimonials', 'how-it-works', 'cta', 'footer']
        if request.sectionName not in valid_sections:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid section name. Must be one of: {valid_sections}"
            )
        
        # Validate engagement type
        valid_engagement_types = ['view', 'interact', 'complete_view']
        if request.engagementType not in valid_engagement_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid engagement type. Must be one of: {valid_engagement_types}"
            )
        
        # Validate timestamp
        try:
            datetime.fromisoformat(request.timestamp.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format")
        
        # Store engagement data in background
        background_tasks.add_task(
            analytics_service.store_feature_engagement,
            request.dict()
        )
        
        logger.info(f"Stored feature engagement for section {request.sectionName}, session {request.sessionId}")
        
        return AnalyticsResponse(
            id=str(uuid.uuid4()),
            status="success",
            message="Feature engagement recorded successfully",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking feature engagement: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record feature engagement")

# Endpoint: GET /analytics/homepage/summary
@router.get("/homepage/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    date_from: Optional[str] = Query(None, description="Start date (ISO format)", alias="dateFrom"),
    date_to: Optional[str] = Query(None, description="End date (ISO format)", alias="dateTo"),
    group_by: str = Query("day", description="Group analytics by time period", alias="groupBy"),
    background_tasks: BackgroundTasks = None
):
    """
    Get analytics summary for date range
    Returns aggregated metrics, conversion rates, and engagement data
    """
    try:
        # Set default date range if not provided (last 30 days)
        if not date_from:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        else:
            try:
                start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid dateFrom format")
        
        if not date_to:
            end_date = datetime.now(timezone.utc)
        else:
            try:
                end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid dateTo format")
        
        # Validate group_by parameter
        valid_group_by = ['hour', 'day', 'week', 'month']
        if group_by not in valid_group_by:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid groupBy. Must be one of: {valid_group_by}"
            )
        
        # Validate date range
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        # Limit date range to 1 year
        if (end_date - start_date).days > 365:
            raise HTTPException(status_code=400, detail="Date range cannot exceed 1 year")
        
        # Get summary data
        summary = await analytics_service.get_analytics_summary(start_date, end_date)
        
        return AnalyticsSummaryResponse(
            dateRange={
                "from": start_date.isoformat(),
                "to": end_date.isoformat()
            },
            totalPageViews=summary['total_page_views'],
            uniqueVisitors=summary['unique_visitors'],
            averageLoadTime=summary['average_load_time'],
            conversionRate=summary['conversion_rate'],
            topConversionEvents=summary['top_conversion_events'],
            performanceMetrics=summary['performance_metrics'],
            sectionEngagement=summary['section_engagement']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics summary")

# Health check endpoint
@router.get("/health")
async def analytics_health():
    """
    Health check for analytics service
    """
    return {
        "status": "healthy",
        "service": "analytics",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }