"""
Batch Processing Optimization System

This module provides advanced batch processing capabilities for efficient
question generation with parallel processing, job queuing, and resource optimization.
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Tuple, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import queue
import heapq
from collections import defaultdict, deque
import uuid
import json
import psutil
import os

logger = logging.getLogger(__name__)

class BatchPriority(Enum):
    """Batch processing priority levels"""
    LOW = "low"                  # Background processing
    NORMAL = "normal"            # Standard processing
    HIGH = "high"                # Priority processing
    URGENT = "urgent"            # Immediate processing

class BatchStatus(Enum):
    """Batch processing status"""
    PENDING = "pending"          # Waiting to be processed
    QUEUED = "queued"           # In queue for processing
    PROCESSING = "processing"   # Currently processing
    COMPLETED = "completed"     # Successfully completed
    FAILED = "failed"           # Failed to process
    CANCELLED = "cancelled"     # Cancelled by user
    PARTIAL = "partial"         # Partially completed

class BatchStrategy(Enum):
    """Batch processing strategies"""
    PARALLEL = "parallel"        # Process items in parallel
    SEQUENTIAL = "sequential"    # Process items sequentially
    ADAPTIVE = "adaptive"        # Adapt based on system resources
    RESOURCE_AWARE = "resource_aware"  # Monitor and adapt to resource usage

@dataclass
class BatchConfig:
    """Batch processing configuration"""
    max_concurrent_jobs: int = 4           # Maximum concurrent batch jobs
    max_items_per_batch: int = 50          # Maximum items per batch
    max_queue_size: int = 1000            # Maximum queue size
    processing_timeout: int = 300          # Timeout per item in seconds
    strategy: BatchStrategy = BatchStrategy.ADAPTIVE
    resource_monitoring: bool = True        # Enable resource monitoring
    auto_scaling: bool = True              # Enable auto-scaling
    memory_limit_mb: int = 2048            # Memory limit in MB
    cpu_limit_percent: float = 80.0        # CPU limit percentage
    enable_retry: bool = True              # Enable retry on failure
    max_retries: int = 3                  # Maximum retry attempts
    retry_delay: float = 1.0              # Retry delay in seconds

@dataclass
class BatchItem:
    """Individual item in a batch"""
    id: str
    data: Any
    priority: BatchPriority
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: BatchStatus = BatchStatus.PENDING
    result: Any = None
    error: Optional[str] = None
    retry_count: int = 0
    processing_time: float = 0.0
    estimated_size: int = 0

@dataclass
class BatchJob:
    """Batch processing job"""
    id: str
    name: str
    items: List[BatchItem]
    priority: BatchPriority
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: BatchStatus = BatchStatus.PENDING
    processing_function: Callable
    config: BatchConfig
    progress: float = 0.0
    total_items: int = 0
    completed_items: int = 0
    failed_items: int = 0
    estimated_time_remaining: float = 0.0
    resource_usage: Dict[str, float] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class BatchMetrics:
    """Batch processing metrics"""
    total_jobs: int = 0
    completed_jobs: int = 0
    failed_jobs: int = 0
    total_items: int = 0
    completed_items: int = 0
    failed_items: int = 0
    average_processing_time: float = 0.0
    throughput: float = 0.0
    resource_efficiency: float = 0.0
    queue_length: int = 0
    active_workers: int = 0

class BatchProcessor:
    """Advanced batch processing system"""
    
    def __init__(self, config: BatchConfig):
        self.config = config
        self.job_queue: queue.PriorityQueue = queue.PriorityQueue()
        self.active_jobs: Dict[str, BatchJob] = {}
        self.completed_jobs: Dict[str, BatchJob] = {}
        self.workers: List[asyncio.Task] = []
        self.executor = ThreadPoolExecutor(max_workers=config.max_concurrent_jobs)
        self.metrics = BatchMetrics()
        self.resource_monitor = ResourceMonitor()
        self.scaling_manager = ScalingManager(config)
        self.retry_manager = RetryManager(config)
        self.shutdown_event = threading.Event()
        self.lock = threading.RLock()
        
        # Start processing
        self._start_processing()
    
    def _start_processing(self):
        """Start batch processing workers"""
        for i in range(self.config.max_concurrent_jobs):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)
        
        # Start monitoring
        asyncio.create_task(self._monitor_resources())
        asyncio.create_task(self._cleanup_completed_jobs())
    
    async def submit_batch(
        self,
        name: str,
        items: List[Any],
        processing_function: Callable,
        priority: BatchPriority = BatchPriority.NORMAL,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Submit a batch job for processing"""
        
        # Create batch items
        batch_items = []
        for i, item_data in enumerate(items):
            batch_item = BatchItem(
                id=f"{name}-item-{i}",
                data=item_data,
                priority=priority,
                created_at=datetime.now(),
                estimated_size=self._estimate_item_size(item_data)
            )
            batch_items.append(batch_item)
        
        # Create batch job
        batch_job = BatchJob(
            id=str(uuid.uuid4()),
            name=name,
            items=batch_items,
            priority=priority,
            created_at=datetime.now(),
            processing_function=processing_function,
            config=self.config,
            total_items=len(batch_items),
            metadata=metadata or {}
        )
        
        # Add to queue
        priority_value = self._get_priority_value(priority)
        self.job_queue.put((priority_value, batch_job.created_at.timestamp(), batch_job))
        
        # Update metrics
        with self.lock:
            self.metrics.total_jobs += 1
            self.metrics.total_items += len(batch_items)
            self.metrics.queue_length = self.job_queue.qsize()
        
        logger.info(f"Batch job submitted: {name} ({len(batch_items)} items)")
        return batch_job.id
    
    def _get_priority_value(self, priority: BatchPriority) -> int:
        """Get numeric priority value"""
        priority_map = {
            BatchPriority.LOW: 4,
            BatchPriority.NORMAL: 3,
            BatchPriority.HIGH: 2,
            BatchPriority.URGENT: 1
        }
        return priority_map.get(priority, 3)
    
    def _estimate_item_size(self, item: Any) -> int:
        """Estimate memory size of an item"""
        try:
            return len(str(item).encode('utf-8'))
        except:
            return 1024  # Default estimate
    
    async def _worker(self, worker_name: str):
        """Worker process for batch jobs"""
        logger.info(f"Batch worker started: {worker_name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Get next job from queue
                try:
                    priority, timestamp, batch_job = self.job_queue.get(timeout=1.0)
                except queue.Empty:
                    continue
                
                # Check resource availability
                if not self.resource_monitor.can_process_job(batch_job):
                    # Re-queue job if resources not available
                    await asyncio.sleep(1.0)
                    self.job_queue.put((priority, timestamp, batch_job))
                    continue
                
                # Process job
                await self._process_batch_job(batch_job, worker_name)
                
            except Exception as e:
                logger.error(f"Worker {worker_name} error: {e}")
                await asyncio.sleep(1.0)
        
        logger.info(f"Batch worker stopped: {worker_name}")
    
    async def _process_batch_job(self, batch_job: BatchJob, worker_name: str):
        """Process a single batch job"""
        
        # Update job status
        with self.lock:
            batch_job.status = BatchStatus.PROCESSING
            batch_job.started_at = datetime.now()
            self.active_jobs[batch_job.id] = batch_job
            self.metrics.active_workers += 1
        
        logger.info(f"Processing batch job: {batch_job.name} ({len(batch_job.items)} items)")
        
        try:
            # Process items based on strategy
            if self.config.strategy == BatchStrategy.PARALLEL:
                await self._process_parallel(batch_job, worker_name)
            elif self.config.strategy == BatchStrategy.SEQUENTIAL:
                await self._process_sequential(batch_job, worker_name)
            else:
                await self._process_adaptive(batch_job, worker_name)
            
            # Update job status
            with self.lock:
                batch_job.status = self._determine_job_status(batch_job)
                batch_job.completed_at = datetime.now()
                self.metrics.completed_jobs += 1
                self.metrics.completed_items += batch_job.completed_items
                self.metrics.failed_items += batch_job.failed_items
            
            # Move to completed jobs
            with self.lock:
                self.active_jobs.pop(batch_job.id, None)
                self.completed_jobs[batch_job.id] = batch_job
                self.metrics.active_workers -= 1
            
            logger.info(f"Batch job completed: {batch_job.name} "
                       f"({batch_job.completed_items}/{batch_job.total_items} items)")
            
        except Exception as e:
            logger.error(f"Batch job failed: {batch_job.name} - {e}")
            
            # Update job status
            with self.lock:
                batch_job.status = BatchStatus.FAILED
                batch_job.completed_at = datetime.now()
                batch_job.error = str(e)
                self.metrics.failed_jobs += 1
            
            # Move to completed jobs
            with self.lock:
                self.active_jobs.pop(batch_job.id, None)
                self.completed_jobs[batch_job.id] = batch_job
                self.metrics.active_workers -= 1
    
    async def _process_parallel(self, batch_job: BatchJob, worker_name: str):
        """Process items in parallel"""
        
        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(self.config.max_concurrent_jobs)
        
        async def process_item(item: BatchItem):
            async with semaphore:
                return await self._process_single_item(item, batch_job.processing_function)
        
        # Process all items in parallel
        tasks = [process_item(item) for item in batch_job.items]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Update batch job with results
        for i, result in enumerate(results):
            item = batch_job.items[i]
            if isinstance(result, Exception):
                item.status = BatchStatus.FAILED
                item.error = str(result)
                batch_job.failed_items += 1
            else:
                item.status = BatchStatus.COMPLETED
                item.result = result
                batch_job.completed_items += 1
            
            batch_job.progress = (i + 1) / len(batch_job.items) * 100
    
    async def _process_sequential(self, batch_job: BatchJob, worker_name: str):
        """Process items sequentially"""
        
        for i, item in enumerate(batch_job.items):
            if self.shutdown_event.is_set():
                item.status = BatchStatus.CANCELLED
                break
            
            try:
                result = await self._process_single_item(item, batch_job.processing_function)
                item.status = BatchStatus.COMPLETED
                item.result = result
                batch_job.completed_items += 1
            except Exception as e:
                item.status = BatchStatus.FAILED
                item.error = str(e)
                batch_job.failed_items += 1
            
            batch_job.progress = (i + 1) / len(batch_job.items) * 100
    
    async def _process_adaptive(self, batch_job: BatchJob, worker_name: str):
        """Process items with adaptive strategy"""
        
        # Determine optimal batch size based on resources
        optimal_batch_size = self.scaling_manager.get_optimal_batch_size(batch_job)
        
        # Process items in adaptive batches
        for i in range(0, len(batch_job.items), optimal_batch_size):
            if self.shutdown_event.is_set():
                break
            
            batch_items = batch_job.items[i:i + optimal_batch_size]
            
            # Process this batch
            await self._process_parallel_batch(batch_items, batch_job.processing_function)
            
            # Update progress
            batch_job.progress = (i + len(batch_items)) / len(batch_job.items) * 100
    
    async def _process_parallel_batch(self, items: List[BatchItem], processing_function: Callable):
        """Process a batch of items in parallel"""
        
        async def process_item(item: BatchItem):
            return await self._process_single_item(item, processing_function)
        
        tasks = [process_item(item) for item in items]
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _process_single_item(self, item: BatchItem, processing_function: Callable) -> Any:
        """Process a single item with retry logic"""
        
        item.status = BatchStatus.PROCESSING
        item.started_at = datetime.now()
        
        try:
            # Process with retry logic
            if self.config.enable_retry:
                result = await self.retry_manager.execute_with_retry(
                    processing_function, item.data
                )
            else:
                result = await processing_function(item.data)
            
            # Update item
            item.completed_at = datetime.now()
            item.processing_time = (item.completed_at - item.started_at).total_seconds()
            item.result = result
            item.status = BatchStatus.COMPLETED
            
            return result
            
        except Exception as e:
            item.completed_at = datetime.now()
            item.processing_time = (item.completed_at - item.started_at).total_seconds()
            item.error = str(e)
            item.status = BatchStatus.FAILED
            raise
    
    def _determine_job_status(self, batch_job: BatchJob) -> BatchStatus:
        """Determine final job status"""
        if batch_job.completed_items == batch_job.total_items:
            return BatchStatus.COMPLETED
        elif batch_job.completed_items > 0:
            return BatchStatus.PARTIAL
        elif batch_job.failed_items == batch_job.total_items:
            return BatchStatus.FAILED
        else:
            return BatchStatus.PARTIAL
    
    async def _monitor_resources(self):
        """Monitor system resources and adjust processing"""
        while not self.shutdown_event.is_set():
            try:
                await asyncio.sleep(5)  # Check every 5 seconds
                
                # Update metrics
                with self.lock:
                    self.metrics.queue_length = self.job_queue.qsize()
                    self.metrics.active_workers = len(self.active_jobs)
                
                # Check if scaling is needed
                if self.config.auto_scaling:
                    await self.scaling_manager.adjust_scaling(self)
                
            except Exception as e:
                logger.error(f"Resource monitoring error: {e}")
    
    async def _cleanup_completed_jobs(self):
        """Clean up old completed jobs"""
        while not self.shutdown_event.is_set():
            try:
                await asyncio.sleep(300)  # Clean up every 5 minutes
                
                cutoff_time = datetime.now() - timedelta(hours=1)
                
                with self.lock:
                    jobs_to_remove = []
                    for job_id, job in self.completed_jobs.items():
                        if job.completed_at and job.completed_at < cutoff_time:
                            jobs_to_remove.append(job_id)
                    
                    for job_id in jobs_to_remove:
                        self.completed_jobs.pop(job_id, None)
                
                logger.debug(f"Cleaned up {len(jobs_to_remove)} completed jobs")
                
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific job"""
        with self.lock:
            # Check active jobs
            if job_id in self.active_jobs:
                job = self.active_jobs[job_id]
                return self._job_to_dict(job)
            
            # Check completed jobs
            if job_id in self.completed_jobs:
                job = self.completed_jobs[job_id]
                return self._job_to_dict(job)
        
        return None
    
    def _job_to_dict(self, job: BatchJob) -> Dict[str, Any]:
        """Convert job to dictionary"""
        return {
            "id": job.id,
            "name": job.name,
            "status": job.status.value,
            "priority": job.priority.value,
            "progress": job.progress,
            "total_items": job.total_items,
            "completed_items": job.completed_items,
            "failed_items": job.failed_items,
            "created_at": job.created_at.isoformat(),
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "estimated_time_remaining": job.estimated_time_remaining,
            "processing_time": (job.completed_at - job.started_at).total_seconds() 
                              if job.started_at and job.completed_at else None,
            "error": job.error
        }
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status"""
        with self.lock:
            return {
                "queue_length": self.metrics.queue_length,
                "active_workers": self.metrics.active_workers,
                "total_jobs": self.metrics.total_jobs,
                "completed_jobs": self.metrics.completed_jobs,
                "failed_jobs": self.metrics.failed_jobs,
                "total_items": self.metrics.total_items,
                "completed_items": self.metrics.completed_items,
                "failed_items": self.metrics.failed_items,
                "average_processing_time": self.metrics.average_processing_time,
                "throughput": self.metrics.throughput
            }
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a batch job"""
        with self.lock:
            # Check active jobs
            if job_id in self.active_jobs:
                job = self.active_jobs[job_id]
                job.status = BatchStatus.CANCELLED
                job.completed_at = datetime.now()
                
                # Move to completed
                self.completed_jobs[job_id] = job
                self.active_jobs.pop(job_id, None)
                self.metrics.active_workers -= 1
                
                logger.info(f"Cancelled job: {job.name}")
                return True
        
        return False
    
    async def shutdown(self):
        """Shutdown the batch processor"""
        logger.info("Shutting down batch processor...")
        
        # Signal shutdown
        self.shutdown_event.set()
        
        # Cancel active jobs
        with self.lock:
            for job in self.active_jobs.values():
                job.status = BatchStatus.CANCELLED
                job.completed_at = datetime.now()
                self.completed_jobs[job.id] = job
        
        # Wait for workers to finish
        if self.workers:
            await asyncio.gather(*self.workers, return_exceptions=True)
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("Batch processor shutdown complete")

class ResourceMonitor:
    """Monitor system resources"""
    
    def __init__(self):
        self.process = psutil.Process(os.getpid())
    
    def get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        return self.process.memory_info().rss / 1024 / 1024
    
    def get_cpu_usage(self) -> float:
        """Get current CPU usage percentage"""
        return self.process.cpu_percent()
    
    def can_process_job(self, batch_job: BatchJob) -> bool:
        """Check if system can handle another job"""
        memory_usage = self.get_memory_usage()
        cpu_usage = self.get_cpu_usage()
        
        # Simple heuristic
        return memory_usage < 1024 and cpu_usage < 80.0

class ScalingManager:
    """Manage auto-scaling of batch processing"""
    
    def __init__(self, config: BatchConfig):
        self.config = config
    
    def get_optimal_batch_size(self, batch_job: BatchJob) -> int:
        """Get optimal batch size based on current conditions"""
        # Simple heuristic - could be more sophisticated
        return min(10, self.config.max_items_per_batch)
    
    async def adjust_scaling(self, processor: BatchProcessor):
        """Adjust scaling based on current load"""
        # Implement scaling logic
        pass

class RetryManager:
    """Manage retry logic for failed items"""
    
    def __init__(self, config: BatchConfig):
        self.config = config
    
    async def execute_with_retry(self, func: Callable, data: Any) -> Any:
        """Execute function with retry logic"""
        last_error = None
        
        for attempt in range(self.config.max_retries + 1):
            try:
                return await func(data)
            except Exception as e:
                last_error = e
                if attempt < self.config.max_retries:
                    await asyncio.sleep(self.config.retry_delay * (2 ** attempt))
        
        raise last_error

# Global batch processor instance
_global_batch_processor: Optional[BatchProcessor] = None

def get_batch_processor(config: Optional[BatchConfig] = None) -> BatchProcessor:
    """Get global batch processor instance"""
    global _global_batch_processor
    
    if _global_batch_processor is None:
        if config is None:
            config = BatchConfig()
        _global_batch_processor = BatchProcessor(config)
    
    return _global_batch_processor

def initialize_batch_processor(config: BatchConfig) -> BatchProcessor:
    """Initialize global batch processor"""
    global _global_batch_processor
    _global_batch_processor = BatchProcessor(config)
    return _global_batch_processor