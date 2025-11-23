"""
RAG Service - Retrieval-Augmented Generation using pgvector
"""
import os
import logging
import psycopg2
from psycopg2.extras import execute_values
from typing import List, Dict
from openai import OpenAI
from anthropic import Anthropic

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.mock_mode = os.getenv("AI_MOCK_MODE", "false").lower() == "true"

        if not self.mock_mode:
            if self.anthropic_key:
                self.llm_client = Anthropic(api_key=self.anthropic_key)
                self.provider = "anthropic"
            elif self.openai_key:
                self.llm_client = OpenAI(api_key=self.openai_key)
                self.provider = "openai"
            else:
                self.mock_mode = True

            if self.openai_key:
                self.embedding_client = OpenAI(api_key=self.openai_key)

    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url)

    async def search_documents(
        self,
        query_embedding: List[float],
        workspace_id: str,
        top_k: int = 5
    ) -> List[Dict]:
        """
        Search for similar documents using vector similarity

        Args:
            query_embedding: Query embedding vector
            workspace_id: Workspace ID to filter by
            top_k: Number of results to return

        Returns:
            List of matching document chunks with relevance scores
        """
        if self.mock_mode:
            logger.info(f"Mock mode: Returning mock search results for workspace {workspace_id}")
            return [
                {
                    "document_id": "doc1",
                    "chunk_text": "This is a mock document chunk about sales strategies.",
                    "relevance": 0.92,
                    "metadata": {"file_name": "sales_playbook.pdf", "page": 1}
                },
                {
                    "document_id": "doc2",
                    "chunk_text": "Another mock chunk about handling objections.",
                    "relevance": 0.88,
                    "metadata": {"file_name": "objection_handling.pdf", "page": 3}
                }
            ]

        try:
            conn = self.get_db_connection()
            cur = conn.cursor()

            # Convert embedding to pgvector format
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"

            # Query similar embeddings using cosine similarity
            query = """
                SELECT
                    de.id,
                    de.document_id,
                    de.chunk_text,
                    d.file_name,
                    d.file_type,
                    1 - (de.embedding <=> %s::vector) as relevance
                FROM document_embeddings de
                JOIN documents d ON d.id = de.document_id
                WHERE d.workspace_id = %s
                ORDER BY de.embedding <=> %s::vector
                LIMIT %s
            """

            cur.execute(query, (embedding_str, workspace_id, embedding_str, top_k))
            results = cur.fetchall()

            cur.close()
            conn.close()

            return [
                {
                    "embedding_id": row[0],
                    "document_id": row[1],
                    "chunk_text": row[2],
                    "relevance": float(row[5]),
                    "metadata": {
                        "file_name": row[3],
                        "file_type": row[4]
                    }
                }
                for row in results
            ]
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            raise

    async def query(
        self,
        query_text: str,
        workspace_id: str,
        top_k: int = 5
    ) -> Dict:
        """
        Query documents and generate answer using RAG

        Args:
            query_text: User's question
            workspace_id: Workspace ID
            top_k: Number of documents to retrieve

        Returns:
            dict with answer, sources, confidence
        """
        if self.mock_mode:
            return {
                "answer": "Based on the available documents, here's what you should know about sales strategies...",
                "sources": [
                    {"document_name": "sales_playbook.pdf", "relevance": 0.92},
                    {"document_name": "objection_handling.pdf", "relevance": 0.88}
                ],
                "confidence": 0.85
            }

        try:
            # Generate embedding for query
            query_embedding_response = self.embedding_client.embeddings.create(
                input=query_text,
                model="text-embedding-3-small"
            )
            query_embedding = query_embedding_response.data[0].embedding

            # Search for relevant documents
            relevant_docs = await self.search_documents(
                query_embedding,
                workspace_id,
                top_k
            )

            if not relevant_docs:
                return {
                    "answer": "I don't have enough information in the knowledge base to answer this question.",
                    "sources": [],
                    "confidence": 0.0
                }

            # Build context from retrieved documents
            context = "\n\n".join([
                f"Document: {doc['metadata']['file_name']}\n{doc['chunk_text']}"
                for doc in relevant_docs
            ])

            # Generate answer using LLM
            prompt = f"""Based on the following context from our sales documents, answer the question.
If the answer is not in the context, say so.

Context:
{context}

Question: {query_text}

Answer:"""

            if self.provider == "anthropic":
                response = self.llm_client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=1000,
                    messages=[{"role": "user", "content": prompt}]
                )
                answer = response.content[0].text
            else:
                response = self.llm_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3
                )
                answer = response.choices[0].message.content

            # Calculate confidence based on relevance scores
            avg_relevance = sum(doc['relevance'] for doc in relevant_docs) / len(relevant_docs)

            return {
                "answer": answer,
                "sources": [
                    {
                        "document_name": doc['metadata']['file_name'],
                        "relevance": doc['relevance'],
                        "excerpt": doc['chunk_text'][:200] + "..."
                    }
                    for doc in relevant_docs
                ],
                "confidence": float(avg_relevance)
            }

        except Exception as e:
            logger.error(f"Error processing RAG query: {str(e)}")
            raise
