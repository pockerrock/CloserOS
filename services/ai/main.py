from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
from dotenv import load_dotenv
from services.embeddings import EmbeddingsService
from services.transcription import TranscriptionService
from services.summarization import SummarizationService
from services.document_processor import DocumentProcessor
from services.rag import RAGService

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CloserOS AI Service",
    description="AI service for embeddings, RAG, and speech-to-text processing",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
embeddings_service = EmbeddingsService()
transcription_service = TranscriptionService()
summarization_service = SummarizationService()
document_processor = DocumentProcessor()
rag_service = RAGService()

# Models
class EmbeddingRequest(BaseModel):
    text: str
    model: str = "text-embedding-3-small"

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    model: str

class DocumentProcessRequest(BaseModel):
    document_id: str
    workspace_id: str
    file_url: str
    file_type: str

class TranscriptRequest(BaseModel):
    audio_url: str
    language: Optional[str] = "en"

class TranscriptResponse(BaseModel):
    text: str
    confidence: float
    duration: float
    words: List[dict] = []

class CallSummaryRequest(BaseModel):
    call_id: str
    transcript: str

class RAGRequest(BaseModel):
    query: str
    workspace_id: str
    top_k: int = 5

class RAGResponse(BaseModel):
    answer: str
    sources: List[dict]
    confidence: float

# Routes
@app.get("/")
async def root():
    return {
        "message": "CloserOS AI Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "services": {
            "openai": os.getenv("OPENAI_API_KEY") is not None,
            "anthropic": os.getenv("ANTHROPIC_API_KEY") is not None,
            "deepgram": os.getenv("DEEPGRAM_API_KEY") is not None,
            "database": os.getenv("DATABASE_URL") is not None,
        }
    }

@app.post("/embeddings", response_model=EmbeddingResponse)
async def create_embedding(request: EmbeddingRequest):
    """
    Generate embeddings for text using OpenAI
    """
    try:
        embedding = await embeddings_service.create_embedding(
            text=request.text,
            model=request.model
        )
        return EmbeddingResponse(
            embedding=embedding,
            model=request.model
        )
    except Exception as e:
        logger.error(f"Error creating embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/process")
async def process_document(file: UploadFile = File(...), workspace_id: str = Form(...)):
    """
    Process document: extract text, chunk it, and generate embeddings
    """
    try:
        # Read file content
        file_content = await file.read()

        # Extract text from document
        text = await document_processor.extract_text(file_content, file.content_type)

        # Clean text
        clean_text = document_processor.clean_text(text)

        # Chunk text
        chunks = embeddings_service.chunk_text(clean_text)

        # Generate embeddings for chunks
        embeddings = await embeddings_service.create_embeddings_batch(chunks)

        return {
            "success": True,
            "text_length": len(clean_text),
            "chunks_count": len(chunks),
            "embeddings_count": len(embeddings),
            "chunks": [
                {
                    "text": chunk,
                    "embedding": embedding
                }
                for chunk, embedding in zip(chunks, embeddings)
            ]
        }
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe", response_model=TranscriptResponse)
async def transcribe_audio(request: TranscriptRequest):
    """
    Transcribe audio using Deepgram
    """
    try:
        result = await transcription_service.transcribe_url(
            audio_url=request.audio_url,
            language=request.language
        )

        return TranscriptResponse(
            text=result["text"],
            confidence=result["confidence"],
            duration=result["duration"],
            words=result.get("words", [])
        )
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize/call")
async def summarize_call(request: CallSummaryRequest):
    """
    Generate AI summary for a call transcript
    """
    try:
        summary = await summarization_service.summarize_call(request.transcript)
        insights = await summarization_service.extract_insights(request.transcript)

        return {
            "call_id": request.call_id,
            "summary": summary["summary"],
            "key_points": summary["key_points"],
            "objections": summary["objections"],
            "sentiment": summary["sentiment"],
            "next_steps": summary["next_steps"],
            "topics": insights["topics"],
            "questions": insights["questions"],
            "pain_points": insights["pain_points"],
            "buying_signals": insights["buying_signals"],
            "confidence": summary["confidence"]
        }
    except Exception as e:
        logger.error(f"Error summarizing call: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/query", response_model=RAGResponse)
async def rag_query(request: RAGRequest):
    """
    Query documents using RAG (Retrieval-Augmented Generation)
    """
    try:
        result = await rag_service.query(
            query_text=request.query,
            workspace_id=request.workspace_id,
            top_k=request.top_k
        )

        return RAGResponse(
            answer=result["answer"],
            sources=result["sources"],
            confidence=result["confidence"]
        )
    except Exception as e:
        logger.error(f"Error processing RAG query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
