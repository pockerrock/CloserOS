"""
Transcription Service - Speech-to-text using Deepgram
"""
import os
import logging
import httpx
from deepgram import DeepgramClient, PrerecordedOptions

logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self):
        self.api_key = os.getenv("DEEPGRAM_API_KEY")
        self.mock_mode = os.getenv("DEEPGRAM_MOCK_MODE", "false").lower() == "true"

        if not self.mock_mode and not self.api_key:
            logger.warning("Deepgram API key not found, running in mock mode")
            self.mock_mode = True

        if not self.mock_mode:
            self.client = DeepgramClient(self.api_key)

    async def transcribe_url(
        self,
        audio_url: str,
        language: str = "en",
        model: str = "nova-2"
    ) -> dict:
        """
        Transcribe audio from URL using Deepgram

        Args:
            audio_url: URL of the audio file
            language: Language code (e.g., 'en', 'es')
            model: Deepgram model to use

        Returns:
            dict with text, confidence, duration, and words
        """
        if self.mock_mode:
            logger.info(f"Mock mode: Generating mock transcript for {audio_url}")
            return {
                "text": "This is a mock transcript of the call recording.",
                "confidence": 0.95,
                "duration": 120.0,
                "words": []
            }

        try:
            options = PrerecordedOptions(
                model=model,
                language=language,
                smart_format=True,
                punctuate=True,
                paragraphs=True,
                utterances=True,
                diarize=True,  # Speaker diarization
            )

            response = self.client.listen.rest.v("1").transcribe_url(
                {"url": audio_url},
                options
            )

            result = response.results
            transcript_text = result.channels[0].alternatives[0].transcript
            confidence = result.channels[0].alternatives[0].confidence
            duration = result.metadata.duration

            words = []
            if hasattr(result.channels[0].alternatives[0], 'words'):
                words = [
                    {
                        "word": w.word,
                        "start": w.start,
                        "end": w.end,
                        "confidence": w.confidence,
                        "speaker": getattr(w, 'speaker', None)
                    }
                    for w in result.channels[0].alternatives[0].words
                ]

            return {
                "text": transcript_text,
                "confidence": confidence,
                "duration": duration,
                "words": words
            }
        except Exception as e:
            logger.error(f"Error transcribing audio: {str(e)}")
            raise

    async def transcribe_file(
        self,
        file_path: str,
        language: str = "en",
        model: str = "nova-2"
    ) -> dict:
        """
        Transcribe audio from local file

        Args:
            file_path: Path to the audio file
            language: Language code
            model: Deepgram model to use

        Returns:
            dict with text, confidence, duration, and words
        """
        if self.mock_mode:
            logger.info(f"Mock mode: Generating mock transcript for {file_path}")
            return {
                "text": "This is a mock transcript of the call recording.",
                "confidence": 0.95,
                "duration": 120.0,
                "words": []
            }

        try:
            with open(file_path, 'rb') as audio:
                buffer_data = audio.read()

            options = PrerecordedOptions(
                model=model,
                language=language,
                smart_format=True,
                punctuate=True,
                paragraphs=True,
                utterances=True,
                diarize=True,
            )

            response = self.client.listen.rest.v("1").transcribe_file(
                {"buffer": buffer_data},
                options
            )

            result = response.results
            transcript_text = result.channels[0].alternatives[0].transcript
            confidence = result.channels[0].alternatives[0].confidence
            duration = result.metadata.duration

            return {
                "text": transcript_text,
                "confidence": confidence,
                "duration": duration,
                "words": []
            }
        except Exception as e:
            logger.error(f"Error transcribing file: {str(e)}")
            raise
