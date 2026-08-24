"""
Interview Agent: Generates candidate-tailored technical & behavioral questions with rubrics.
"""
from typing import List, Dict, Any
from src.schemas.agents import TailoredQuestion
from src.schemas.candidate import CandidateProfile
from src.schemas.job import JobDescription

class InterviewAgent:
    """Specialized Agent for customized interview question generation and evaluation rubrics."""
    
    def generate_tailored_questions(
        self,
        candidate: CandidateProfile,
        jd: JobDescription,
        num_questions: int = 5
    ) -> List[TailoredQuestion]:
        questions: List[TailoredQuestion] = []
        cand_skills = [s.lower() for s in candidate.hard_skills]
        
        # 1. Technical Competency Question
        if "pytorch" in cand_skills or "tensorflow" in cand_skills:
            questions.append(TailoredQuestion(
                category="Deep Learning & Inference",
                question="How have you optimized PyTorch model inference latency when deploying behind high-throughput microservices?",
                target_competency="Model Optimization & Quantization",
                expected_answer_points=[
                    "Use of ONNX Runtime or TensorRT",
                    "Batching strategies and dynamic execution",
                    "GPU memory management and caching"
                ],
                difficulty="Advanced"
            ))
            
        # 2. Vector Search / RAG Question
        if any(s in cand_skills for s in ["faiss", "pinecone", "milvus", "qdrant", "rag", "embeddings"]):
            questions.append(TailoredQuestion(
                category="Retrieval Architecture (RAG)",
                question="Explain your approach to vector index scaling and handling cosine distance recalculations across millions of embeddings in FAISS/Pinecone.",
                target_competency="Dense Vector Search & HNSW Indexing",
                expected_answer_points=[
                    "IVFFlat vs HNSW trade-offs",
                    "Hierarchical clustering indexing",
                    "Hybrid search combining BM25 keyword + dense vectors"
                ],
                difficulty="Advanced"
            ))
            
        # 3. System Architecture & API Question
        questions.append(TailoredQuestion(
            category="System Design & Reliability",
            question="Given a peak load of 10,000 concurrent candidate ranking queries, how would you architect our FastAPI backend and vector caches?",
            target_competency="Distributed Systems & Caching",
            expected_answer_points=[
                "Horizontal pod autoscaling on Kubernetes",
                "Redis vector embedding caching layer",
                "Asynchronous worker queues (Celery/RabbitMQ) for heavy inference"
            ],
            difficulty="Medium"
        ))
        
        # 4. Behavioral & Ownership Question
        questions.append(TailoredQuestion(
            category="Behavioral & Problem Solving",
            question="Describe a critical production bug or model drift event you encountered. How did you diagnose, resolve, and prevent recurrence?",
            target_competency="Ownership & Post-Mortem Discipline",
            expected_answer_points=[
                "Structured root cause analysis",
                "Telemetry telemetry instrumentation",
                "Automated regression testing and canary rollouts"
            ],
            difficulty="Medium"
        ))
        
        # 5. Culture & Collaboration
        questions.append(TailoredQuestion(
            category="Team Collaboration",
            question="How do you bridge technical architecture decisions with non-technical stakeholders like Talent Acquisition or Product Managers?",
            target_competency="Cross-Functional Communication",
            expected_answer_points=[
                "Translating model metrics into business ROI",
                "Establishing clear SLAs and documentation",
                "Iterative feedback loops"
            ],
            difficulty="Easy"
        ))
        
        return questions[:num_questions]

interview_agent = InterviewAgent()
