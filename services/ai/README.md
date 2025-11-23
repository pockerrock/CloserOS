# CloserOS AI Service

Python-based AI service for embeddings, RAG, and speech-to-text processing.

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the service
uvicorn main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## Endpoints

### Health Check
- `GET /health` - Check service health and API key status

### Embeddings
- `POST /embeddings` - Generate embeddings for text

### Transcription
- `POST /transcribe` - Transcribe audio to text

### RAG
- `POST /rag/query` - Query documents using RAG

### Call Analysis
- `POST /summarize/call` - Generate AI summary for call transcript

## Development

```bash
# Run with auto-reload
uvicorn main:app --reload

# Run tests (TODO)
pytest

# Format code
black .
isort .
```

## Docker

```bash
# Build image
docker build -t closeros-ai .

# Run container
docker run -p 8000:8000 --env-file .env closeros-ai
```
