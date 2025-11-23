"""
Summarization Service - Generate AI summaries for calls and documents
"""
import os
import logging
from openai import OpenAI
from anthropic import Anthropic

logger = logging.getLogger(__name__)

class SummarizationService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.mock_mode = os.getenv("AI_MOCK_MODE", "false").lower() == "true"

        if not self.mock_mode:
            if self.anthropic_key:
                self.client = Anthropic(api_key=self.anthropic_key)
                self.provider = "anthropic"
            elif self.openai_key:
                self.client = OpenAI(api_key=self.openai_key)
                self.provider = "openai"
            else:
                logger.warning("No AI API keys found, running in mock mode")
                self.mock_mode = True

    async def summarize_call(self, transcript: str, call_info: dict = None) -> dict:
        """
        Generate AI summary for a call transcript

        Args:
            transcript: Call transcript text
            call_info: Optional additional call information

        Returns:
            dict with summary, key_points, objections, sentiment, next_steps
        """
        if self.mock_mode:
            logger.info("Mock mode: Generating mock call summary")
            return {
                "summary": "The call was productive and the lead showed strong interest in the product.",
                "key_points": [
                    "Lead is interested in premium tier",
                    "Budget approved for Q1",
                    "Decision maker identified"
                ],
                "objections": [
                    "Price concerns",
                    "Implementation timeline"
                ],
                "sentiment": "positive",
                "next_steps": [
                    "Send proposal by end of week",
                    "Schedule demo for next Tuesday"
                ],
                "confidence": 0.9
            }

        try:
            prompt = f"""Analyze the following sales call transcript and provide:
1. A brief summary (2-3 sentences)
2. Key points discussed
3. Any objections raised
4. Overall sentiment (positive, neutral, negative)
5. Recommended next steps

Transcript:
{transcript}

Please format your response as JSON with the following structure:
{{
    "summary": "...",
    "key_points": ["...", "..."],
    "objections": ["...", "..."],
    "sentiment": "positive|neutral|negative",
    "next_steps": ["...", "..."]
}}
"""

            if self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=2000,
                    messages=[{"role": "user", "content": prompt}]
                )
                content = response.content[0].text
            else:  # openai
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content

            # Parse JSON response
            import json
            result = json.loads(content)
            result["confidence"] = 0.9
            return result

        except Exception as e:
            logger.error(f"Error generating call summary: {str(e)}")
            raise

    async def extract_insights(self, transcript: str) -> dict:
        """
        Extract detailed insights from call transcript

        Args:
            transcript: Call transcript text

        Returns:
            dict with topics, questions, pain_points, buying_signals
        """
        if self.mock_mode:
            return {
                "topics": ["pricing", "features", "implementation"],
                "questions": ["When can we start?", "What's included in support?"],
                "pain_points": ["Current solution is slow", "High costs"],
                "buying_signals": ["Need to solve this quickly", "Budget is approved"]
            }

        try:
            prompt = f"""Extract detailed insights from this sales call:
1. Main topics discussed
2. Questions asked by the lead
3. Pain points mentioned
4. Buying signals detected

Transcript:
{transcript}

Format as JSON:
{{
    "topics": ["...", "..."],
    "questions": ["...", "..."],
    "pain_points": ["...", "..."],
    "buying_signals": ["...", "..."]
}}
"""

            if self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=1500,
                    messages=[{"role": "user", "content": prompt}]
                )
                content = response.content[0].text
            else:
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content

            import json
            return json.loads(content)

        except Exception as e:
            logger.error(f"Error extracting insights: {str(e)}")
            raise
