"""
Embeddings Service - Generate and manage document embeddings
"""
import os
from typing import List, Optional
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

class EmbeddingsService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.mock_mode = os.getenv("OPENAI_MOCK_MODE", "false").lower() == "true"

        if not self.mock_mode and not self.api_key:
            logger.warning("OpenAI API key not found, running in mock mode")
            self.mock_mode = True

        if not self.mock_mode:
            self.client = OpenAI(api_key=self.api_key)

    async def create_embedding(
        self,
        text: str,
        model: str = "text-embedding-3-small"
    ) -> List[float]:
        """
        Generate embedding for a piece of text

        Args:
            text: Text to embed
            model: OpenAI embedding model to use

        Returns:
            List of floats representing the embedding vector
        """
        if self.mock_mode:
            logger.info(f"Mock mode: Generating mock embedding for text of length {len(text)}")
            # Return mock embedding (1536 dimensions for text-embedding-3-small)
            return [0.0] * 1536

        try:
            response = self.client.embeddings.create(
                input=text,
                model=model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error creating embedding: {str(e)}")
            raise

    async def create_embeddings_batch(
        self,
        texts: List[str],
        model: str = "text-embedding-3-small"
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in a batch

        Args:
            texts: List of texts to embed
            model: OpenAI embedding model to use

        Returns:
            List of embedding vectors
        """
        if self.mock_mode:
            logger.info(f"Mock mode: Generating mock embeddings for {len(texts)} texts")
            return [[0.0] * 1536 for _ in texts]

        try:
            response = self.client.embeddings.create(
                input=texts,
                model=model
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            logger.error(f"Error creating embeddings batch: {str(e)}")
            raise

    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Split text into overlapping chunks for embedding

        Args:
            text: Text to chunk
            chunk_size: Maximum characters per chunk
            overlap: Number of characters to overlap between chunks

        Returns:
            List of text chunks
        """
        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = min(start + chunk_size, text_length)
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap

        return chunks
