"""
Enhanced AI Providers Integration Example

This example demonstrates how to use the enhanced AI provider system
with multiple providers, intelligent routing, and failover capabilities.
"""

import asyncio
import logging
from typing import Dict, Any
from datetime import datetime

from . import (
    BaseAIProvider,
    ProviderConfig,
    ProviderRegistry,
    GenerationRequest,
    GenerationResult,
    QuestionType,
    Difficulty,
    ModelRouter,
    RoutingStrategy,
    PerformanceMonitor,
    FailoverManager,
    get_provider_registry,
    get_model_router,
    get_performance_monitor,
    get_failover_manager,
    initialize_providers,
    initialize_model_router,
    initialize_performance_monitoring,
    initialize_failover_system,
    OpenAIProvider,
    AnthropicProvider,
    GoogleProvider,
    CohereProvider
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedAISystem:
    """Enhanced AI system with multiple providers and intelligent routing"""
    
    def __init__(self):
        self.registry: ProviderRegistry = None
        self.router: ModelRouter = None
        self.monitor: PerformanceMonitor = None
        self.failover_manager: FailoverManager = None
        
    async def initialize(self):
        """Initialize the enhanced AI system"""
        
        logger.info("Initializing Enhanced AI System...")
        
        # Initialize provider registry
        self.registry = await get_provider_registry()
        
        # Configure providers (in a real system, these would come from environment variables)
        await self._setup_providers()
        
        # Initialize all systems
        await initialize_providers()
        await initialize_model_router()
        await initialize_performance_monitoring()
        await initialize_failover_system()
        
        # Get system components
        self.router = await get_model_router()
        self.monitor = await get_performance_monitor()
        self.failover_manager = await get_failover_manager()
        
        logger.info("Enhanced AI System initialized successfully!")
    
    async def _setup_providers(self):
        """Setup AI providers with configuration"""
        
        # Note: In production, these API keys would come from environment variables
        # This is example configuration
        
        # OpenAI GPT-4 Provider
        if False:  # Set to True if you have OpenAI API key
            openai_config = ProviderConfig(
                api_key="your-openai-api-key",
                base_url="https://api.openai.com/v1",
                model="gpt-4-turbo-preview",
                max_tokens=2000,
                temperature=0.7
            )
            openai_provider = OpenAIProvider(openai_config)
            self.registry.register_provider(openai_provider)
        
        # Anthropic Claude Provider
        if False:  # Set to True if you have Anthropic API key
            anthropic_config = ProviderConfig(
                api_key="your-anthropic-api-key",
                base_url="https://api.anthropic.com",
                model="claude-3-7-sonnet-20250219",
                max_tokens=2000,
                temperature=0.7
            )
            anthropic_provider = AnthropicProvider(anthropic_config)
            self.registry.register_provider(anthropic_provider)
        
        # Google Gemini Provider
        if False:  # Set to True if you have Google API key
            google_config = ProviderConfig(
                api_key="your-google-api-key",
                base_url="https://generativelanguage.googleapis.com",
                model="gemini-pro",
                max_tokens=2000,
                temperature=0.7
            )
            google_provider = GoogleProvider(google_config)
            self.registry.register_provider(google_provider)
        
        # Cohere Provider
        if False:  # Set to True if you have Cohere API key
            cohere_config = ProviderConfig(
                api_key="your-cohere-api-key",
                base_url="https://api.cohere.com",
                model="command-r-plus",
                max_tokens=2000,
                temperature=0.7
            )
            cohere_provider = CohereProvider(cohere_config)
            self.registry.register_provider(cohere_provider)
        
        logger.info(f"Setup {len(self.registry.get_all_providers())} providers")
    
    async def generate_questions(
        self,
        content: str,
        question_count: int = 5,
        question_types: list = None,
        difficulty: Difficulty = Difficulty.INTERMEDIATE,
        routing_strategy: RoutingStrategy = RoutingStrategy.BALANCED,
        preferred_provider: str = None
    ) -> GenerationResult:
        """Generate questions with intelligent routing and failover"""
        
        if question_types is None:
            question_types = [QuestionType.MULTIPLE_CHOICE]
        
        # Create generation request
        request = GenerationRequest(
            id=f"gen_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            content=content,
            question_types=question_types,
            difficulty=difficulty,
            question_count=question_count,
            context={
                "audience": "general learners",
                "educational_level": "undergraduate",
                "domain": "general"
            },
            options={
                "include_explanations": True,
                "difficulty_variation": True
            }
        )
        
        logger.info(f"Generating {question_count} questions using {routing_strategy.value} routing")
        
        try:
            # Route request to best provider
            routing_decision = await self.router.route_request(
                request,
                strategy=routing_strategy,
                preferred_provider=preferred_provider
            )
            
            logger.info(f"Routing decision: {routing_decision.provider_id} (confidence: {routing_decision.confidence:.2f})")
            logger.info(f"Reasoning: {routing_decision.reasoning}")
            logger.info(f"Estimated cost: ${routing_decision.estimated_cost:.4f}")
            logger.info(f"Estimated time: {routing_decision.estimated_time:.2f}s")
            
            # Generate with failover protection
            result = await self.failover_manager.generate_with_failover(
                request,
                preferred_provider=routing_decision.provider_id
            )
            
            # Record result for performance monitoring
            self.monitor.record_generation_result({
                "provider": result.provider,
                "cost": result.cost,
                "quality_score": result.quality_score,
                "processing_time": result.processing_time,
                "metrics": result.metrics,
                "questions_generated": len(result.questions)
            })
            
            logger.info(f"Successfully generated {len(result.questions)} questions")
            logger.info(f"Provider: {result.provider}")
            logger.info(f"Quality score: {result.quality_score:.2f}")
            logger.info(f"Cost: ${result.cost:.4f}")
            logger.info(f"Processing time: {result.processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to generate questions: {str(e)}")
            raise
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        
        status = {
            "providers": self.registry.get_provider_status(),
            "routing_stats": self.router.get_routing_stats(),
            "system_overview": self.monitor.get_system_overview(),
            "circuit_breakers": self.failover_manager.get_circuit_breaker_status(),
            "failover_stats": self.failover_manager.get_failover_statistics(),
            "health_status": self.failover_manager.get_health_status()
        }
        
        return status
    
    async def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        
        return await self.monitor.generate_performance_report()
    
    async def demonstrate_features(self):
        """Demonstrate system features"""
        
        logger.info("=== Enhanced AI System Demo ===")
        
        # Sample content for question generation
        sample_content = """
        Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.
        
        The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide.
        
        Machine learning algorithms build a model based on sample data, known as "training data", in order to make predictions or decisions without being explicitly programmed to do so. Machine learning algorithms are used in a wide variety of applications, such as in medicine, email filtering, speech recognition, and computer vision.
        """
        
        # Demonstrate different routing strategies
        strategies = [
            RoutingStrategy.QUALITY_FIRST,
            RoutingStrategy.COST_EFFECTIVE,
            RoutingStrategy.BALANCED,
            RoutingStrategy.FASTEST
        ]
        
        for strategy in strategies:
            logger.info(f"\n--- Testing {strategy.value} routing ---")
            
            try:
                result = await self.generate_questions(
                    content=sample_content,
                    question_count=3,
                    question_types=[QuestionType.MULTIPLE_CHOICE, QuestionType.SHORT_ANSWER],
                    difficulty=Difficulty.INTERMEDIATE,
                    routing_strategy=strategy
                )
                
                logger.info(f"✓ Success with {strategy.value}: {len(result.questions)} questions")
                
                # Show first question as example
                if result.questions:
                    q = result.questions[0]
                    logger.info(f"Example question: {q.get('question', 'N/A')[:100]}...")
                
            except Exception as e:
                logger.info(f"✗ Failed with {strategy.value}: {str(e)}")
        
        # Show system status
        logger.info("\n--- System Status ---")
        status = await self.get_system_status()
        
        logger.info(f"Active providers: {len([p for p in status['providers'].values() if p['metrics']['success_rate'] > 0])}")
        logger.info(f"Total requests: {status['routing_stats']['total_requests']}")
        logger.info(f"System health: {status['system_overview']['system_status']}")
        
        # Show provider details
        for provider_id, provider_status in status['providers'].items():
            logger.info(f"Provider {provider_id}: {provider_status['metrics']['success_rate']:.1f}% success rate")
    
    async def cleanup(self):
        """Cleanup resources"""
        
        logger.info("Cleaning up Enhanced AI System...")
        
        # Stop monitoring
        await self.monitor.stop_monitoring()
        await self.failover_manager.stop_health_monitoring()
        
        logger.info("Enhanced AI System cleaned up")

async def main():
    """Main demonstration function"""
    
    system = EnhancedAISystem()
    
    try:
        # Initialize system
        await system.initialize()
        
        # Show initial status
        status = await system.get_system_status()
        logger.info(f"System initialized with {len(status['providers'])} providers")
        
        # Run demonstration
        await system.demonstrate_features()
        
        # Generate performance report
        logger.info("\n--- Performance Report ---")
        report = await system.generate_performance_report()
        
        for provider_id, provider_report in report.items():
            logger.info(f"{provider_id}: {provider_report.successful_requests}/{provider_report.total_requests} successful")
        
    except Exception as e:
        logger.error(f"Demo failed: {str(e)}")
    
    finally:
        await system.cleanup()

if __name__ == "__main__":
    asyncio.run(main())