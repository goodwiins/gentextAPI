"""
Analytics Service
Business logic for analytics data processing and aggregation
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

from ..config.database import get_database

logger = logging.getLogger(__name__)

class AnalyticsService:
    """
    Service for processing and aggregating analytics data
    """
    
    def __init__(self):
        self.db = get_database()
        
    async def store_page_metrics(self, metrics_data: Dict[str, Any]):
        """
        Store homepage page metrics in database
        """
        try:
            # Store in homepage_metrics collection
            document = {
                **metrics_data,
                'createdAt': datetime.utcnow().isoformat(),
                'type': 'homepage_metrics'
            }
            
            await self.db.create_document('homepage_metrics', document)
            logger.info(f"Stored page metrics for session {metrics_data['sessionId']}")
            
        except Exception as e:
            logger.error(f"Error storing page metrics: {str(e)}")
            raise
    
    async def store_conversion_event(self, event_data: Dict[str, Any]):
        """
        Store conversion event in database
        """
        try:
            document = {
                **event_data,
                'createdAt': datetime.utcnow().isoformat(),
                'type': 'conversion_event'
            }
            
            await self.db.create_document('conversion_events', document)
            logger.info(f"Stored conversion event for session {event_data['sessionId']}")
            
        except Exception as e:
            logger.error(f"Error storing conversion event: {str(e)}")
            raise
    
    async def store_feature_engagement(self, engagement_data: Dict[str, Any]):
        """
        Store feature engagement data in database
        """
        try:
            document = {
                **engagement_data,
                'createdAt': datetime.utcnow().isoformat(),
                'type': 'feature_engagement'
            }
            
            await self.db.create_document('feature_engagement', document)
            logger.info(f"Stored feature engagement for session {engagement_data['sessionId']}")
            
        except Exception as e:
            logger.error(f"Error storing feature engagement: {str(e)}")
            raise
    
    async def get_analytics_summary(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Get comprehensive analytics summary for date range
        """
        try:
            # Get page metrics
            page_metrics = await self._get_page_metrics_summary(start_date, end_date)
            
            # Get conversion events
            conversion_data = await self._get_conversion_summary(start_date, end_date)
            
            # Get feature engagement
            engagement_data = await self._get_engagement_summary(start_date, end_date)
            
            # Calculate unique visitors
            unique_sessions = await self._get_unique_sessions(start_date, end_date)
            
            return {
                'total_page_views': page_metrics['total_views'],
                'unique_visitors': unique_sessions,
                'average_load_time': page_metrics['average_load_time'],
                'conversion_rate': conversion_data['conversion_rate'],
                'top_conversion_events': conversion_data['top_events'],
                'performance_metrics': {
                    'average_lcp': page_metrics['average_lcp'],
                    'average_fcp': page_metrics['average_fcp'],
                    'average_cls': page_metrics['average_cls'],
                    'average_fid': page_metrics['average_fid']
                },
                'section_engagement': engagement_data['section_stats']
            }
            
        except Exception as e:
            logger.error(f"Error generating analytics summary: {str(e)}")
            raise
    
    async def _get_page_metrics_summary(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Get aggregated page metrics for date range
        """
        try:
            # Query homepage_metrics collection
            query = {
                'timestamp': {
                    '$gte': start_date.isoformat(),
                    '$lte': end_date.isoformat()
                }
            }
            
            metrics = await self.db.find_documents('homepage_metrics', query)
            
            if not metrics:
                return {
                    'total_views': 0,
                    'average_load_time': 0,
                    'average_lcp': 0,
                    'average_fcp': 0,
                    'average_cls': 0,
                    'average_fid': 0
                }
            
            # Calculate averages
            load_times = [m['pageView']['loadTime'] for m in metrics]
            lcp_times = [m['pageView']['lcp'] for m in metrics]
            fcp_times = [m['pageView']['fcp'] for m in metrics]
            cls_values = [m['pageView']['cls'] for m in metrics]
            fid_values = [m['pageView'].get('fid', 0) for m in metrics]
            
            return {
                'total_views': len(metrics),
                'average_load_time': round(statistics.mean(load_times), 2),
                'average_lcp': round(statistics.mean(lcp_times), 2),
                'average_fcp': round(statistics.mean(fcp_times), 2),
                'average_cls': round(statistics.mean(cls_values), 3),
                'average_fid': round(statistics.mean([f for f in fid_values if f > 0]), 2) if any(fid_values) else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting page metrics summary: {str(e)}")
            raise
    
    async def _get_conversion_summary(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Get conversion data summary for date range
        """
        try:
            query = {
                'timestamp': {
                    '$gte': start_date.isoformat(),
                    '$lte': end_date.isoformat()
                }
            }
            
            events = await self.db.find_documents('conversion_events', query)
            
            if not events:
                return {
                    'total_events': 0,
                    'successful_conversions': 0,
                    'conversion_rate': 0,
                    'top_events': []
                }
            
            total_events = len(events)
            successful_conversions = sum(1 for e in events if e['successful'])
            conversion_rate = (successful_conversions / total_events * 100) if total_events > 0 else 0
            
            # Group by event type
            event_counts = defaultdict(lambda: {'total': 0, 'successful': 0})
            for event in events:
                event_type = event['eventType']
                event_counts[event_type]['total'] += 1
                if event['successful']:
                    event_counts[event_type]['successful'] += 1
            
            # Create top events list
            top_events = []
            for event_type, counts in event_counts.items():
                success_rate = (counts['successful'] / counts['total'] * 100) if counts['total'] > 0 else 0
                top_events.append({
                    'eventType': event_type,
                    'count': counts['total'],
                    'successRate': round(success_rate, 2)
                })
            
            # Sort by count
            top_events.sort(key=lambda x: x['count'], reverse=True)
            
            return {
                'total_events': total_events,
                'successful_conversions': successful_conversions,
                'conversion_rate': round(conversion_rate, 2),
                'top_events': top_events[:5]  # Top 5 events
            }
            
        except Exception as e:
            logger.error(f"Error getting conversion summary: {str(e)}")
            raise
    
    async def _get_engagement_summary(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Get feature engagement summary for date range
        """
        try:
            query = {
                'timestamp': {
                    '$gte': start_date.isoformat(),
                    '$lte': end_date.isoformat()
                }
            }
            
            engagements = await self.db.find_documents('feature_engagement', query)
            
            if not engagements:
                return {
                    'section_stats': []
                }
            
            # Group by section
            section_data = defaultdict(lambda: {
                'views': 0,
                'interactions': 0,
                'durations': [],
                'scroll_depths': []
            })
            
            for engagement in engagements:
                section = engagement['sectionName']
                section_data[section]['views'] += 1
                
                if engagement['engagementType'] == 'interact':
                    section_data[section]['interactions'] += 1
                
                section_data[section]['durations'].append(engagement['duration'])
                section_data[section]['scroll_depths'].append(engagement['scrollDepth'])
            
            # Calculate section statistics
            section_stats = []
            for section, data in section_data.items():
                avg_duration = statistics.mean(data['durations']) if data['durations'] else 0
                avg_scroll_depth = statistics.mean(data['scroll_depths']) if data['scroll_depths'] else 0
                interaction_rate = (data['interactions'] / data['views'] * 100) if data['views'] > 0 else 0
                
                section_stats.append({
                    'sectionName': section,
                    'totalViews': data['views'],
                    'averageDuration': round(avg_duration, 2),
                    'averageScrollDepth': round(avg_scroll_depth, 2),
                    'interactionRate': round(interaction_rate, 2)
                })
            
            # Sort by views
            section_stats.sort(key=lambda x: x['totalViews'], reverse=True)
            
            return {
                'section_stats': section_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting engagement summary: {str(e)}")
            raise
    
    async def _get_unique_sessions(self, start_date: datetime, end_date: datetime) -> int:
        """
        Get count of unique sessions in date range
        """
        try:
            # Get all session IDs from metrics in date range
            query = {
                'timestamp': {
                    '$gte': start_date.isoformat(),
                    '$lte': end_date.isoformat()
                }
            }
            
            metrics = await self.db.find_documents('homepage_metrics', query, ['sessionId'])
            session_ids = set(m['sessionId'] for m in metrics)
            
            return len(session_ids)
            
        except Exception as e:
            logger.error(f"Error getting unique sessions: {str(e)}")
            return 0
    
    async def cleanup_old_data(self, days_old: int = 90):
        """
        Clean up old analytics data ( GDPR compliance )
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            # Clean up old data from all collections
            collections = ['homepage_metrics', 'conversion_events', 'feature_engagement']
            
            total_deleted = 0
            for collection in collections:
                query = {
                    'createdAt': {
                        '$lt': cutoff_date.isoformat()
                    }
                }
                
                deleted = await self.db.delete_documents(collection, query)
                total_deleted += deleted
                
                logger.info(f"Deleted {deleted} old documents from {collection}")
            
            logger.info(f"Cleanup completed: {total_deleted} documents deleted")
            return total_deleted
            
        except Exception as e:
            logger.error(f"Error during data cleanup: {str(e)}")
            raise