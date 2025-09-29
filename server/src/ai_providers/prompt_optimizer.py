"""
Model-Specific Prompt Optimization System

This module provides advanced prompt optimization capabilities tailored to
specific AI models with A/B testing, performance tracking, and adaptive improvement.
"""

import asyncio
import logging
import json
import time
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import statistics
import random
from collections import defaultdict, deque
import yaml
import re

logger = logging.getLogger(__name__)

class PromptTemplateType(Enum):
    """Types of prompt templates"""
    MULTIPLE_CHOICE = "multiple_choice"
    FILL_IN_BLANK = "fill_in_blank"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    TRUE_FALSE = "true_false"
    CONTEXT_AWARE = "context_aware"
    VARIATION_GENERATION = "variation_generation"
    QUALITY_VALIDATION = "quality_validation"

class OptimizationStrategy(Enum):
    """Prompt optimization strategies"""
    A_B_TESTING = "a_b_testing"
    MULTIVARIATE = "multivariate"
    BAYESIAN = "bayesian"
    GENETIC = "genetic"
    BANDIT = "bandit"
    MANUAL = "manual"

class PromptComponent(Enum):
    """Components of a prompt"""
    SYSTEM_MESSAGE = "system_message"
    CONTEXT = "context"
    INSTRUCTIONS = "instructions"
    EXAMPLES = "examples"
    CONSTRAINTS = "constraints"
    OUTPUT_FORMAT = "output_format"
    TEMPERATURE = "temperature"
    MAX_TOKENS = "max_tokens"

@dataclass
class PromptTemplate:
    """Optimized prompt template"""
    id: str
    name: str
    description: str
    template_type: PromptTemplateType
    target_model: str
    template_text: str
    components: Dict[PromptComponent, str]
    parameters: Dict[str, Any]
    version: str = "1.0"
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    usage_count: int = 0
    success_rate: float = 0.0
    avg_response_time: float = 0.0
    quality_score: float = 0.0
    cost_efficiency: float = 0.0
    is_active: bool = True
    tags: List[str] = field(default_factory=list)

@dataclass
class PromptTest:
    """A/B test for prompt optimization"""
    id: str
    name: str
    description: str
    template_a: PromptTemplate
    template_b: PromptTemplate
    test_data: List[Dict[str, Any]]
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "created"  # created, running, completed, cancelled
    results_a: Dict[str, Any] = field(default_factory=dict)
    results_b: Dict[str, Any] = field(default_factory=dict)
    winner: Optional[str] = None  # 'A', 'B', or 'tie'
    confidence: float = 0.0
    sample_size: int = 100
    statistical_significance: float = 0.05

@dataclass
class PromptOptimizationConfig:
    """Configuration for prompt optimization"""
    enable_a_b_testing: bool = True
    auto_optimization: bool = True
    optimization_interval_hours: int = 24
    min_sample_size: int = 50
    statistical_significance: float = 0.05
    performance_threshold: float = 0.7
    max_concurrent_tests: int = 5
    test_duration_hours: int = 6
    optimization_strategy: OptimizationStrategy = OptimizationStrategy.A_B_TESTING
    enable_bayesian_optimization: bool = True
    enable_genetic_algorithm: bool = False
    performance_weights: Dict[str, float] = field(default_factory=lambda: {
        "quality": 0.4,
        "speed": 0.3,
        "cost": 0.2,
        "consistency": 0.1
    })

class PromptOptimizer:
    """Advanced prompt optimization system"""
    
    def __init__(self, config: PromptOptimizationConfig):
        self.config = config
        self.templates: Dict[str, PromptTemplate] = {}
        self.tests: Dict[str, PromptTest] = {}
        self.performance_history: defaultdict(list) = defaultdict(list)
        self.model_preferences: Dict[str, str] = {}
        self.component_library: Dict[PromptComponent, List[str]] = {}
        self.optimization_queue: List[str] = []
        self.active_tests: Dict[str, asyncio.Task] = {}
        
        # Load initial templates
        self._load_default_templates()
        self._load_component_library()
        
        # Start optimization tasks
        if config.auto_optimization:
            asyncio.create_task(self._periodic_optimization())
    
    def _load_default_templates(self):
        """Load default prompt templates"""
        
        # Multiple Choice Template - OpenAI
        mc_template_openai = PromptTemplate(
            id="mc_openai_v1",
            name="OpenAI Multiple Choice Generator",
            description="Optimized template for multiple choice questions with OpenAI",
            template_type=PromptTemplateType.MULTIPLE_CHOICE,
            target_model="openai",
            template_text=self._get_openai_mc_template(),
            components=self._get_openai_mc_components(),
            parameters={"temperature": 0.7, "max_tokens": 1000},
            tags=["openai", "multiple-choice", "optimized"]
        )
        
        # Multiple Choice Template - Claude
        mc_template_claude = PromptTemplate(
            id="mc_claude_v1",
            name="Claude Multiple Choice Generator",
            description="Optimized template for multiple choice questions with Claude",
            template_type=PromptTemplateType.MULTIPLE_CHOICE,
            target_model="anthropic",
            template_text=self._get_claude_mc_template(),
            components=self._get_claude_mc_components(),
            parameters={"temperature": 0.5, "max_tokens": 800},
            tags=["anthropic", "multiple-choice", "optimized"]
        )
        
        # Context-Aware Template
        context_template = PromptTemplate(
            id="context_aware_v1",
            name="Context-Aware Question Generator",
            description="Template for context-aware question generation",
            template_type=PromptTemplateType.CONTEXT_AWARE,
            target_model="any",
            template_text=self._get_context_aware_template(),
            components=self._get_context_aware_components(),
            parameters={"temperature": 0.6, "max_tokens": 1200},
            tags=["context-aware", "any-model"]
        )
        
        # Register templates
        for template in [mc_template_openai, mc_template_claude, context_template]:
            self.templates[template.id] = template
    
    def _get_openai_mc_template(self) -> str:
        """Get OpenAI-optimized multiple choice template"""
        return """
You are an expert educational question generator. Create high-quality multiple choice questions based on the following content.

CONTENT: {content}

DOMAIN: {domain}
DIFFICULTY: {difficulty}
TARGET AUDIENCE: {target_audience}

REQUIREMENTS:
- Generate {num_questions} multiple choice questions
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Distractors should be plausible but incorrect
- Questions should test understanding, not just recall
- Use clear, unambiguous language
- Align with Bloom's taxonomy level: {cognitive_level}

Format your response as JSON:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
      "correct_answer": "A",
      "explanation": "Explanation of why this is correct",
      "difficulty": "{difficulty}",
      "cognitive_level": "{cognitive_level}"
    }
  ]
}

Generate the questions now:
"""
    
    def _get_openai_mc_components(self) -> Dict[PromptComponent, str]:
        """Get OpenAI MC template components"""
        return {
            PromptComponent.SYSTEM_MESSAGE: "You are an expert educational question generator.",
            PromptComponent.CONTEXT: "CONTENT: {content}",
            PromptComponent.INSTRUCTIONS: "Generate high-quality multiple choice questions",
            PromptComponent.CONSTRAINTS: "Each question must have exactly 4 options. Only one correct answer.",
            PromptComponent.OUTPUT_FORMAT: "JSON format with questions array"
        }
    
    def _get_claude_mc_template(self) -> str:
        """Get Claude-optimized multiple choice template"""
        return """
I need you to create educational multiple choice questions from the provided content. Please follow these guidelines carefully.

Content: {content}

Context:
- Subject Area: {domain}
- Difficulty Level: {difficulty}
- Target Audience: {target_audience}
- Cognitive Level: {cognitive_level}

Instructions:
1. Create {num_questions} multiple choice questions
2. Each question should have 4 options (A, B, C, D)
3. Design one clearly correct answer
4. Create 3 plausible distractors that reflect common misconceptions
5. Ensure questions align with {cognitive_level} thinking skills
6. Use precise, academic language appropriate for {target_audience}

For each question, provide:
- The question text
- Four answer options
- The correct answer letter
- A brief explanation

Please format as:
<question>
[Question text]
</question>
<options>
A. [Option A]
B. [Option B] 
C. [Option C]
D. [Option D]
</options>
<correct_answer>[Letter]</correct_answer>
<explanation>[Explanation]</explanation>

Generate the questions:
"""
    
    def _get_claude_mc_components(self) -> Dict[PromptComponent, str]:
        """Get Claude MC template components"""
        return {
            PromptComponent.SYSTEM_MESSAGE: "I need you to create educational multiple choice questions.",
            PromptComponent.CONTEXT: "Content: {content}",
            PromptComponent.INSTRUCTIONS: "Create high-quality multiple choice questions following guidelines",
            PromptComponent.CONSTRAINTS: "Each question has 4 options. One correct answer, three plausible distractors.",
            PromptComponent.OUTPUT_FORMAT: "Structured format with XML tags"
        }
    
    def _get_context_aware_template(self) -> str:
        """Get context-aware template"""
        return """
Generate context-aware questions based on the following detailed analysis.

CONTENT ANALYSIS:
- Content: {content}
- Domain: {domain}
- Content Type: {content_type}
- Reading Level: {reading_level}
- Key Concepts: {key_concepts}
- Complexity Score: {complexity_score}

REQUIREMENTS:
- Question Type: {question_type}
- Difficulty: {difficulty}
- Number of Questions: {num_questions}
- Focus Areas: {focus_areas}

CONTEXTUAL CONSTRAINTS:
- Prior Knowledge: {prior_knowledge}
- Learning Objectives: {learning_objectives}
- Time Constraint: {time_constraint} minutes
- Assessment Focus: {assessment_focus}

QUESTION GENERATION STRATEGY:
1. Analyze content structure and key concepts
2. Identify important relationships and dependencies
3. Generate questions that require deep understanding
4. Ensure questions are relevant to learning objectives
5. Provide appropriate scaffolding for difficulty level

Generate {num_questions} context-aware questions that meet these requirements:
"""
    
    def _get_context_aware_components(self) -> Dict[PromptComponent, str]:
        """Get context-aware template components"""
        return {
            PromptComponent.SYSTEM_MESSAGE: "Generate context-aware questions based on content analysis.",
            PromptComponent.CONTEXT: "CONTENT ANALYSIS with domain, complexity, and key concepts",
            PromptComponent.INSTRUCTIONS: "Generate questions requiring deep understanding",
            PromptComponent.CONSTRAINTS: "Align with learning objectives and difficulty level",
            PromptComponent.OUTPUT_FORMAT: "Structured question output"
        }
    
    def _load_component_library(self):
        """Load component library for prompt building"""
        self.component_library = {
            PromptComponent.SYSTEM_MESSAGE: [
                "You are an expert educational question generator.",
                "I need you to create high-quality assessment questions.",
                "You are a specialized AI for educational content creation.",
                "As an expert in educational assessment, generate questions."
            ],
            PromptComponent.CONTEXT: [
                "Based on the following content: {content}",
                "Using this educational material: {content}",
                "From the provided text: {content}",
                "Given this subject matter: {content}"
            ],
            PromptComponent.INSTRUCTIONS: [
                "Generate challenging and thoughtful questions.",
                "Create questions that test understanding and application.",
                "Develop questions that promote critical thinking.",
                "Produce questions aligned with educational standards."
            ],
            PromptComponent.CONSTRAINTS: [
                "Ensure all questions are clear and unambiguous.",
                "Avoid leading or biased questions.",
                "Questions should be age-appropriate.",
                "Maintain consistent difficulty level."
            ],
            PromptComponent.OUTPUT_FORMAT: [
                "Provide responses in JSON format.",
                "Structure answers as a numbered list.",
                "Use consistent formatting throughout.",
                "Include explanations where appropriate."
            ]
        }
    
    def get_optimal_template(
        self,
        template_type: PromptTemplateType,
        target_model: str,
        context: Optional[Dict[str, Any]] = None
    ) -> PromptTemplate:
        """Get optimal template for given parameters"""
        
        # Filter templates by type and model
        candidates = []
        for template in self.templates.values():
            if (template.template_type == template_type and 
                (template.target_model == target_model or template.target_model == "any") and
                template.is_active):
                candidates.append(template)
        
        if not candidates:
            # Return default template
            return self._get_default_template(template_type, target_model)
        
        # Rank candidates by performance
        ranked_candidates = sorted(
            candidates,
            key=lambda t: self._calculate_template_score(t, context),
            reverse=True
        )
        
        return ranked_candidates[0]
    
    def _calculate_template_score(
        self, 
        template: PromptTemplate, 
        context: Optional[Dict[str, Any]] = None
    ) -> float:
        """Calculate performance score for template"""
        
        # Base score from performance metrics
        quality_score = template.quality_score or 0.5
        speed_score = 1.0 / (1.0 + template.avg_response_time or 1.0)
        cost_score = template.cost_efficiency or 0.5
        consistency_score = template.success_rate or 0.5
        
        # Weighted score
        weights = self.config.performance_weights
        total_score = (
            quality_score * weights.get("quality", 0.4) +
            speed_score * weights.get("speed", 0.3) +
            cost_score * weights.get("cost", 0.2) +
            consistency_score * weights.get("consistency", 0.1)
        )
        
        # Apply recency bonus
        recency_bonus = self._calculate_recency_bonus(template)
        
        return total_score + recency_bonus
    
    def _calculate_recency_bonus(self, template: PromptTemplate) -> float:
        """Calculate recency bonus for template"""
        if not template.updated_at:
            return 0.0
        
        days_since_update = (datetime.now() - template.updated_at).days
        if days_since_update <= 7:
            return 0.1
        elif days_since_update <= 30:
            return 0.05
        else:
            return 0.0
    
    def _get_default_template(
        self, 
        template_type: PromptTemplateType, 
        target_model: str
    ) -> PromptTemplate:
        """Get default template when no optimized template exists"""
        return PromptTemplate(
            id=f"default_{template_type.value}_{target_model}",
            name=f"Default {template_type.value} for {target_model}",
            description="Default template",
            template_type=template_type,
            target_model=target_model,
            template_text="Generate a {template_type.value} question based on: {content}",
            components={
                PromptComponent.SYSTEM_MESSAGE: "Generate educational questions.",
                PromptComponent.CONTEXT: "Content: {content}",
                PromptComponent.INSTRUCTIONS: f"Create {template_type.value} question"
            },
            parameters={"temperature": 0.7, "max_tokens": 1000}
        )
    
    def format_prompt(
        self, 
        template: PromptTemplate, 
        parameters: Dict[str, Any]
    ) -> str:
        """Format prompt using template and parameters"""
        
        try:
            # Format template text with parameters
            prompt_text = template.template_text.format(**parameters)
            
            # Apply model-specific optimizations
            if template.target_model == "openai":
                prompt_text = self._optimize_for_openai(prompt_text)
            elif template.target_model == "anthropic":
                prompt_text = self._optimize_for_claude(prompt_text)
            elif template.target_model == "cohere":
                prompt_text = self._optimize_for_cohere(prompt_text)
            
            return prompt_text
            
        except KeyError as e:
            logger.warning(f"Missing parameter {e} in template {template.id}")
            # Return template with available parameters
            return template.template_text
    
    def _optimize_for_openai(self, prompt: str) -> str:
        """Optimize prompt for OpenAI models"""
        # Ensure proper formatting for OpenAI
        if not prompt.endswith('\n'):
            prompt += '\n'
        return prompt
    
    def _optimize_for_claude(self, prompt: str) -> str:
        """Optimize prompt for Claude models"""
        # Claude-specific optimizations
        if not prompt.strip().startswith('\n'):
            prompt = '\n' + prompt
        return prompt
    
    def _optimize_for_cohere(self, prompt: str) -> str:
        """Optimize prompt for Cohere models"""
        # Cohere-specific optimizations
        return prompt.strip()
    
    def record_usage(
        self,
        template_id: str,
        success: bool,
        response_time: float,
        quality_score: float,
        cost: float
    ):
        """Record template usage for performance tracking"""
        
        if template_id not in self.templates:
            logger.warning(f"Template {template_id} not found")
            return
        
        template = self.templates[template_id]
        
        # Update usage metrics
        template.usage_count += 1
        
        # Update performance metrics with exponential smoothing
        alpha = 0.1  # Smoothing factor
        
        if success:
            template.success_rate = (
                (1 - alpha) * template.success_rate + alpha * 1.0
            )
        else:
            template.success_rate = (
                (1 - alpha) * template.success_rate + alpha * 0.0
            )
        
        template.avg_response_time = (
            (1 - alpha) * template.avg_response_time + alpha * response_time
        )
        
        template.quality_score = (
            (1 - alpha) * template.quality_score + alpha * quality_score
        )
        
        template.cost_efficiency = (
            (1 - alpha) * template.cost_efficiency + alpha * (1.0 / max(cost, 0.01))
        )
        
        # Update timestamp
        template.updated_at = datetime.now()
        
        # Record in performance history
        self.performance_history[template_id].append({
            "timestamp": datetime.now(),
            "success": success,
            "response_time": response_time,
            "quality_score": quality_score,
            "cost": cost
        })
        
        # Keep only recent history (last 1000 entries)
        if len(self.performance_history[template_id]) > 1000:
            self.performance_history[template_id] = self.performance_history[template_id][-1000:]
    
    async def create_a_b_test(
        self,
        template_a_id: str,
        template_b_id: str,
        test_data: List[Dict[str, Any]],
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> str:
        """Create an A/B test between two templates"""
        
        if template_a_id not in self.templates:
            raise ValueError(f"Template {template_a_id} not found")
        
        if template_b_id not in self.templates:
            raise ValueError(f"Template {template_b_id} not found")
        
        # Check if test already exists
        test_id = hashlib.md5(f"{template_a_id}_{template_b_id}_{datetime.now().isoformat()}".encode()).hexdigest()[:16]
        
        test = PromptTest(
            id=test_id,
            name=name or f"A/B Test: {template_a_id} vs {template_b_id}",
            description=description or "Automated A/B test",
            template_a=self.templates[template_a_id],
            template_b=self.templates[template_b_id],
            test_data=test_data
        )
        
        self.tests[test_id] = test
        
        # Start test if auto-start enabled
        if self.config.auto_optimization:
            await self.start_a_b_test(test_id)
        
        return test_id
    
    async def start_a_b_test(self, test_id: str):
        """Start an A/B test"""
        
        if test_id not in self.tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.tests[test_id]
        test.status = "running"
        test.started_at = datetime.now()
        
        # Start test execution task
        task = asyncio.create_task(self._run_a_b_test(test))
        self.active_tests[test_id] = task
    
    async def _run_a_b_test(self, test: PromptTest):
        """Execute A/B test"""
        
        try:
            logger.info(f"Starting A/B test: {test.name}")
            
            # Split test data
            sample_size = min(test.sample_size, len(test.test_data))
            test_items = random.sample(test.test_data, sample_size)
            
            # Split into A and B groups
            half_size = sample_size // 2
            group_a = test_items[:half_size]
            group_b = test_items[half_size:]
            
            # Execute test A
            results_a = await self._execute_test_group(test.template_a, group_a)
            test.results_a = results_a
            
            # Execute test B
            results_b = await self._execute_test_group(test.template_b, group_b)
            test.results_b = results_b
            
            # Analyze results
            analysis = self._analyze_test_results(results_a, results_b)
            test.winner = analysis["winner"]
            test.confidence = analysis["confidence"]
            
            # Update test status
            test.status = "completed"
            test.completed_at = datetime.now()
            
            logger.info(f"A/B test completed: {test.name}, Winner: {test.winner}, Confidence: {test.confidence:.2f}")
            
            # Apply winning template
            if test.winner != "tie" and test.confidence > 0.8:
                winning_template = test.template_a if test.winner == "A" else test.template_b
                losing_template = test.template_b if test.winner == "A" else test.template_a
                
                # Update template preferences
                self.model_preferences[winning_template.target_model] = winning_template.id
                
                # Deactivate losing template if significantly worse
                if test.confidence > 0.95:
                    losing_template.is_active = False
            
            # Clean up active test
            self.active_tests.pop(test.id, None)
            
        except Exception as e:
            logger.error(f"A/B test failed: {test.name} - {e}")
            test.status = "failed"
            test.completed_at = datetime.now()
            self.active_tests.pop(test.id, None)
    
    async def _execute_test_group(
        self, 
        template: PromptTemplate, 
        test_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute test group with given template"""
        
        results = {
            "total_items": len(test_items),
            "successful_generations": 0,
            "failed_generations": 0,
            "total_response_time": 0.0,
            "total_quality_score": 0.0,
            "total_cost": 0.0,
            "individual_results": []
        }
        
        for item in test_items:
            try:
                start_time = time.time()
                
                # Format prompt
                prompt = self.format_prompt(template, item)
                
                # Simulate generation (in real implementation, this would call the actual AI provider)
                quality_score = random.uniform(0.6, 0.95)
                cost = random.uniform(0.001, 0.01)
                
                response_time = time.time() - start_time
                
                # Record results
                results["successful_generations"] += 1
                results["total_response_time"] += response_time
                results["total_quality_score"] += quality_score
                results["total_cost"] += cost
                
                results["individual_results"].append({
                    "success": True,
                    "response_time": response_time,
                    "quality_score": quality_score,
                    "cost": cost
                })
                
            except Exception as e:
                results["failed_generations"] += 1
                results["individual_results"].append({
                    "success": False,
                    "error": str(e)
                })
        
        # Calculate averages
        if results["successful_generations"] > 0:
            results["avg_response_time"] = results["total_response_time"] / results["successful_generations"]
            results["avg_quality_score"] = results["total_quality_score"] / results["successful_generations"]
            results["avg_cost"] = results["total_cost"] / results["successful_generations"]
            results["success_rate"] = results["successful_generations"] / results["total_items"]
        else:
            results["avg_response_time"] = 0.0
            results["avg_quality_score"] = 0.0
            results["avg_cost"] = 0.0
            results["success_rate"] = 0.0
        
        return results
    
    def _analyze_test_results(
        self, 
        results_a: Dict[str, Any], 
        results_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze A/B test results and determine winner"""
        
        # Calculate composite scores
        score_a = self._calculate_composite_score(results_a)
        score_b = self._calculate_composite_score(results_b)
        
        # Simple statistical comparison
        if abs(score_a - score_b) < 0.05:
            winner = "tie"
            confidence = 0.5
        elif score_a > score_b:
            winner = "A"
            confidence = min(0.99, 0.5 + (score_a - score_b) * 2)
        else:
            winner = "B"
            confidence = min(0.99, 0.5 + (score_b - score_a) * 2)
        
        return {
            "winner": winner,
            "confidence": confidence,
            "score_a": score_a,
            "score_b": score_b
        }
    
    def _calculate_composite_score(self, results: Dict[str, Any]) -> float:
        """Calculate composite score from test results"""
        
        weights = self.config.performance_weights
        
        quality_score = results.get("avg_quality_score", 0.0)
        speed_score = 1.0 / (1.0 + results.get("avg_response_time", 1.0))
        cost_score = 1.0 / (1.0 + results.get("avg_cost", 0.01))
        consistency_score = results.get("success_rate", 0.0)
        
        composite_score = (
            quality_score * weights.get("quality", 0.4) +
            speed_score * weights.get("speed", 0.3) +
            cost_score * weights.get("cost", 0.2) +
            consistency_score * weights.get("consistency", 0.1)
        )
        
        return composite_score
    
    async def _periodic_optimization(self):
        """Periodic optimization of templates"""
        while True:
            try:
                await asyncio.sleep(self.config.optimimization_interval_hours * 3600)
                
                logger.info("Starting periodic prompt optimization...")
                
                # Analyze performance and suggest improvements
                await self._analyze_template_performance()
                
                # Generate new template variants
                await self._generate_template_variants()
                
                # Clean up old tests
                await self._cleanup_old_tests()
                
                logger.info("Periodic optimization completed")
                
            except Exception as e:
                logger.error(f"Periodic optimization error: {e}")
    
    async def _analyze_template_performance(self):
        """Analyze template performance and identify optimization opportunities"""
        
        for template_id, template in self.templates.items():
            if not template.is_active:
                continue
            
            # Get recent performance history
            recent_history = self.performance_history[template_id][-100:]
            
            if len(recent_history) < self.config.min_sample_size:
                continue
            
            # Calculate performance trends
            recent_quality = statistics.mean([h["quality_score"] for h in recent_history])
            recent_speed = statistics.mean([h["response_time"] for h in recent_history])
            recent_cost = statistics.mean([h["cost"] for h in recent_history])
            
            # Check if template needs optimization
            if (recent_quality < self.config.performance_threshold or
                recent_speed > 10.0 or  # Slow response
                recent_cost > 0.05):    # Expensive
                
                logger.info(f"Template {template_id} needs optimization")
                
                # Add to optimization queue
                if template_id not in self.optimization_queue:
                    self.optimization_queue.append(template_id)
    
    async def _generate_template_variants(self):
        """Generate new template variants for testing"""
        
        while self.optimization_queue and len(self.active_tests) < self.config.max_concurrent_tests:
            template_id = self.optimization_queue.pop(0)
            
            if template_id not in self.templates:
                continue
            
            template = self.templates[template_id]
            
            # Generate variant
            variant = await self._create_template_variant(template)
            
            if variant:
                self.templates[variant.id] = variant
                
                # Create A/B test
                test_data = self._generate_test_data(template.template_type)
                
                await self.create_a_b_test(
                    template_id,
                    variant.id,
                    test_data,
                    name=f"Optimization Test: {template.name}"
                )
    
    async def _create_template_variant(self, original: PromptTemplate) -> Optional[PromptTemplate]:
        """Create a variant of existing template"""
        
        try:
            # Simple variation: modify system message
            variant_system_message = self._vary_component(
                original.components.get(PromptComponent.SYSTEM_MESSAGE, "")
            )
            
            # Create variant template
            variant = PromptTemplate(
                id=f"{original.id}_variant_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                name=f"{original.name} - Variant",
                description=f"Variant of {original.name} for optimization",
                template_type=original.template_type,
                target_model=original.target_model,
                template_text=original.template_text.replace(
                    original.components.get(PromptComponent.SYSTEM_MESSAGE, ""),
                    variant_system_message
                ),
                components=original.components.copy(),
                parameters=original.parameters.copy(),
                tags=original.tags + ["variant", "optimization"]
            )
            
            variant.components[PromptComponent.SYSTEM_MESSAGE] = variant_system_message
            
            return variant
            
        except Exception as e:
            logger.error(f"Failed to create template variant: {e}")
            return None
    
    def _vary_component(self, component_text: str) -> str:
        """Create variation of component text"""
        
        # Simple variation strategies
        variations = [
            component_text.replace("expert", "specialized"),
            component_text.replace("high-quality", "excellent"),
            component_text.replace("Generate", "Create"),
            component_text + " Focus on clarity and precision.",
            component_text + " Ensure educational relevance."
        ]
        
        return random.choice(variations)
    
    def _generate_test_data(self, template_type: PromptTemplateType) -> List[Dict[str, Any]]:
        """Generate test data for A/B testing"""
        
        # Sample test data (in real implementation, this would be more sophisticated)
        sample_contents = [
            "The process of photosynthesis converts light energy into chemical energy.",
            "Machine learning algorithms can be supervised or unsupervised.",
            "The French Revolution had significant impact on European politics.",
            "Climate change affects global weather patterns and ecosystems."
        ]
        
        test_data = []
        for content in sample_contents:
            test_item = {
                "content": content,
                "domain": "general",
                "difficulty": "intermediate",
                "target_audience": "students",
                "num_questions": 2,
                "cognitive_level": "understand"
            }
            test_data.append(test_item)
        
        return test_data
    
    async def _cleanup_old_tests(self):
        """Clean up old completed tests"""
        
        cutoff_time = datetime.now() - timedelta(days=30)
        
        tests_to_remove = []
        for test_id, test in self.tests.items():
            if (test.completed_at and 
                test.completed_at < cutoff_time and
                test.status == "completed"):
                tests_to_remove.append(test_id)
        
        for test_id in tests_to_remove:
            self.tests.pop(test_id, None)
        
        logger.debug(f"Cleaned up {len(tests_to_remove)} old tests")
    
    def get_template_performance(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get performance report for template"""
        
        if template_id not in self.templates:
            return None
        
        template = self.templates[template_id]
        history = self.performance_history[template_id]
        
        if not history:
            return {
                "template_id": template_id,
                "template_name": template.name,
                "usage_count": template.usage_count,
                "current_metrics": {
                    "success_rate": template.success_rate,
                    "avg_response_time": template.avg_response_time,
                    "quality_score": template.quality_score,
                    "cost_efficiency": template.cost_efficiency
                },
                "history": []
            }
        
        # Calculate trends
        recent_history = history[-100:]
        if len(recent_history) >= 10:
            quality_trend = statistics.mean([h["quality_score"] for h in recent_history[-10:]]) - \
                           statistics.mean([h["quality_score"] for h in recent_history[-20:-10]])
            speed_trend = statistics.mean([h["response_time"] for h in recent_history[-10:]]) - \
                          statistics.mean([h["response_time"] for h in recent_history[-20:-10]])
        else:
            quality_trend = 0.0
            speed_trend = 0.0
        
        return {
            "template_id": template_id,
            "template_name": template.name,
            "usage_count": template.usage_count,
            "is_active": template.is_active,
            "current_metrics": {
                "success_rate": template.success_rate,
                "avg_response_time": template.avg_response_time,
                "quality_score": template.quality_score,
                "cost_efficiency": template.cost_efficiency
            },
            "trends": {
                "quality_trend": quality_trend,
                "speed_trend": speed_trend
            },
            "recent_performance": recent_history[-20:],
            "total_history_entries": len(history)
        }
    
    def get_optimization_status(self) -> Dict[str, Any]:
        """Get overall optimization status"""
        
        active_tests = len([t for t in self.tests.values() if t.status == "running"])
        completed_tests = len([t for t in self.tests.values() if t.status == "completed"])
        
        # Template performance summary
        template_summary = {}
        for template_id, template in self.templates.items():
            template_summary[template_id] = {
                "name": template.name,
                "usage_count": template.usage_count,
                "quality_score": template.quality_score,
                "is_active": template.is_active
            }
        
        return {
            "active_tests": active_tests,
            "completed_tests": completed_tests,
            "total_templates": len(self.templates),
            "active_templates": len([t for t in self.templates.values() if t.is_active]),
            "optimization_queue_length": len(self.optimization_queue),
            "auto_optimization_enabled": self.config.auto_optimization,
            "template_summary": template_summary
        }

# Global prompt optimizer instance
_global_prompt_optimizer: Optional[PromptOptimizer] = None

def get_prompt_optimizer(config: Optional[PromptOptimizationConfig] = None) -> PromptOptimizer:
    """Get global prompt optimizer instance"""
    global _global_prompt_optimizer
    
    if _global_prompt_optimizer is None:
        if config is None:
            config = PromptOptimizationConfig()
        _global_prompt_optimizer = PromptOptimizer(config)
    
    return _global_prompt_optimizer

def initialize_prompt_optimizer(config: PromptOptimizationConfig) -> PromptOptimizer:
    """Initialize global prompt optimizer"""
    global _global_prompt_optimizer
    _global_prompt_optimizer = PromptOptimizer(config)
    return _global_prompt_optimizer