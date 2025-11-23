"""
Document Processor - Extract text from various document formats
"""
import logging
from typing import Optional
import PyPDF2
import docx
import io

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Process and extract text from various document formats"""

    async def extract_text(self, file_content: bytes, file_type: str) -> str:
        """
        Extract text from document

        Args:
            file_content: Binary file content
            file_type: MIME type of the file

        Returns:
            Extracted text
        """
        try:
            if "pdf" in file_type.lower():
                return await self._extract_from_pdf(file_content)
            elif "word" in file_type.lower() or "docx" in file_type.lower():
                return await self._extract_from_docx(file_content)
            elif "text" in file_type.lower() or "txt" in file_type.lower():
                return file_content.decode('utf-8', errors='ignore')
            else:
                logger.warning(f"Unsupported file type: {file_type}")
                return ""
        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            raise

    async def _extract_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF"""
        try:
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"

            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            raise

    async def _extract_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX"""
        try:
            doc_file = io.BytesIO(file_content)
            doc = docx.Document(doc_file)

            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"

            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {str(e)}")
            raise

    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        # Remove extra whitespace
        text = " ".join(text.split())
        # Remove special characters but keep punctuation
        text = text.replace('\x00', '')
        return text.strip()
