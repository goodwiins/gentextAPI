"""
Database Configuration
Setup for database connections and operations
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

# Configure logging
logger = logging.getLogger(__name__)

class DatabaseService:
    """
    Mock database service for development/testing
    In production, this would connect to Appwrite or another database
    """
    
    def __init__(self):
        # In-memory storage for demo purposes
        self.collections = {
            'homepage_metrics': [],
            'conversion_events': [],
            'feature_engagement': []
        }
        logger.info("Database service initialized (mock mode)")
    
    async def create_document(self, collection_name: str, document: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a document in the specified collection
        """
        try:
            # Add ID and timestamp if not present
            if '_id' not in document:
                document['_id'] = f"doc_{len(self.collections[collection_name]) + 1}"
            
            document['_created_at'] = datetime.now(timezone.utc).isoformat()
            
            # Store document
            self.collections[collection_name].append(document)
            
            logger.debug(f"Created document in {collection_name}: {document['_id']}")
            return document
            
        except Exception as e:
            logger.error(f"Error creating document in {collection_name}: {str(e)}")
            raise
    
    async def find_documents(self, collection_name: str, query: Dict[str, Any], fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Find documents in a collection based on query
        """
        try:
            documents = self.collections[collection_name]
            results = []
            
            for doc in documents:
                # Simple query matching (in production, use proper query language)
                if self._matches_query(doc, query):
                    if fields:
                        # Return only specified fields
                        filtered_doc = {field: doc.get(field) for field in fields}
                        results.append(filtered_doc)
                    else:
                        results.append(doc)
            
            logger.debug(f"Found {len(results)} documents in {collection_name}")
            return results
            
        except Exception as e:
            logger.error(f"Error finding documents in {collection_name}: {str(e)}")
            raise
    
    async def update_document(self, collection_name: str, document_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a document in the specified collection
        """
        try:
            collection = self.collections[collection_name]
            
            for i, doc in enumerate(collection):
                if doc.get('_id') == document_id:
                    collection[i].update(updates)
                    collection[i]['_updated_at'] = datetime.now(timezone.utc).isoformat()
                    return collection[i]
            
            raise ValueError(f"Document {document_id} not found in {collection_name}")
            
        except Exception as e:
            logger.error(f"Error updating document in {collection_name}: {str(e)}")
            raise
    
    async def delete_document(self, collection_name: str, document_id: str) -> bool:
        """
        Delete a document from the specified collection
        """
        try:
            collection = self.collections[collection_name]
            
            for i, doc in enumerate(collection):
                if doc.get('_id') == document_id:
                    del collection[i]
                    logger.debug(f"Deleted document {document_id} from {collection_name}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting document from {collection_name}: {str(e)}")
            raise
    
    async def delete_documents(self, collection_name: str, query: Dict[str, Any]) -> int:
        """
        Delete multiple documents based on query
        """
        try:
            collection = self.collections[collection_name]
            original_count = len(collection)
            
            # Keep documents that don't match the query
            collection[:] = [doc for doc in collection if not self._matches_query(doc, query)]
            
            deleted_count = original_count - len(collection)
            logger.debug(f"Deleted {deleted_count} documents from {collection_name}")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error deleting documents from {collection_name}: {str(e)}")
            raise
    
    def _matches_query(self, document: Dict[str, Any], query: Dict[str, Any]) -> bool:
        """
        Simple query matching for demo purposes
        """
        for key, value in query.items():
            if key in document:
                if isinstance(value, dict):
                    # Handle operators like $gte, $lte
                    if '$gte' in value and document[key] < value['$gte']:
                        return False
                    if '$lte' in value and document[key] > value['$lte']:
                        return False
                elif document[key] != value:
                    return False
            else:
                return False
        return True

# Global database service instance
_database_service: Optional[DatabaseService] = None

def get_database() -> DatabaseService:
    """
    Get the database service instance (singleton)
    """
    global _database_service
    
    if _database_service is None:
        _database_service = DatabaseService()
    
    return _database_service

def initialize_database():
    """
    Initialize the database service
    """
    global _database_service
    
    if _database_service is None:
        _database_service = DatabaseService()
        logger.info("Database service initialized")
    
    return _database_service

def close_database():
    """
    Close database connections
    """
    global _database_service
    
    if _database_service is not None:
        _database_service = None
        logger.info("Database service closed")