import os
import re
import json
import datetime
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from openai import OpenAI
import anthropic

from prompt_clinical_extraction import CLINICAL_EXTRACTION_PROMPT, CATEGORIES

# Load environment variables from .env
load_dotenv()

class ExtractionService:
    def __init__(self):
        self.categories = CATEGORIES

        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.claude_key = os.getenv("CLAUDE_API_KEY")

        self.openai_client = None
        self.claude_client = None

        if self.openai_key:
            self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            print("OpenAI API initialized")

        if self.claude_key:
            self.claude_client = anthropic.Anthropic(api_key=self.claude_key)
            print("Claude API initialized as fallback")

        if not self.openai_key and not self.claude_key:
            print("⚠️ No API keys found. Please set OPENAI_API_KEY or CLAUDE_API_KEY in .env")

    # -------------------------------
    # Main Transcript Processing Logic
    # -------------------------------

    async def process_transcript(self, transcript: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        options = options or {}

        try:
            if not transcript or not isinstance(transcript, str):
                raise ValueError("Invalid transcript provided")

            cleaned = self.clean_transcript(transcript)
            full_prompt = self.generate_prompt(cleaned)

            extracted_text = await self.extract_clinical_data(full_prompt, options)
            structured = self.structure_output(extracted_text)
            validation = self.validate_extraction(structured)

            return {
                "success": True,
                "data": structured,
                "validation": validation,
                "metadata": {
                    "processedAt": datetime.datetime.now(datetime.UTC).isoformat(),
                    "transcriptLength": len(cleaned),
                    "extractionMethod": options.get("method", "default")
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "metadata": {"processedAt": datetime.datetime.utcnow().isoformat()}
            }

    # -------------------------------
    # Helper Functions
    # -------------------------------

    def clean_transcript(self, transcript: str) -> str:
        return (
            transcript.strip()
            .replace("\n", " ")
            .replace("\r", " ")
            .replace("\t", " ")
            .replace("  ", " ")
        )[:50000]

    def generate_prompt(self, transcript: str) -> str:
        return CLINICAL_EXTRACTION_PROMPT.replace("{{TRANSCRIPT}}", transcript)

    # -------------------------------
    # Extraction Methods
    # -------------------------------

    async def extract_clinical_data(self, prompt: str, options: Dict[str, Any]) -> str:
        if options.get("mockResponse"):
            return self.generate_mock_response()

        if self.openai_client:
            try:
                return await self.extract_with_openai(prompt)
            except Exception as e:
                print(f"OpenAI extraction failed: {e}")
                if self.claude_client:
                    print("Falling back to Claude API...")
                    return await self.extract_with_claude(prompt)
                raise

        elif self.claude_client:
            return await self.extract_with_claude(prompt)

        raise RuntimeError("No API keys configured. Set OPENAI_API_KEY or CLAUDE_API_KEY.")

    async def extract_with_openai(self, prompt: str) -> str:
        print("Sending request to OpenAI API...")
        response = self.openai_client.chat.completions.create(model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        messages=[
            {"role": "system", "content": "You are a medical AI scribe assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=4000)
        content = response.choices[0].message.content
        print("✅ Successfully received response from OpenAI API")
        return content

    async def extract_with_claude(self, prompt: str) -> str:
        print("Sending request to Claude API...")
        response = self.claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text
        print("✅ Successfully received response from Claude API")
        return text

    # -------------------------------
    # Structuring and Validation
    # -------------------------------

    def structure_output(self, raw_output: str) -> Dict[str, Any]:
        structure = {"categories": [], "summary": {}}
        match = re.search(
            r"=== CLINICAL DATA EXTRACTION ===([\s\S]*?)=== END OF EXTRACTION ===",
            raw_output
        )
        if match:
            structure["categories"] = self.parse_section(match.group(1))

        structure["summary"] = {
            "totalDataPoints": len(structure["categories"]),
            "categoriesFound": [c["category"] for c in structure["categories"]],
            "confidenceScore": None
        }
        return structure

    def parse_section(self, section: str) -> List[Dict[str, Any]]:
        lines = [l.strip() for l in section.splitlines() if l.strip()]
        data_points = []
        current_item = None

        for line in lines:
            if re.match(r"^\d+\.", line):
                if current_item:
                    data_points.append(current_item)
                current_item = {
                    "category": re.sub(r"^\d+\.\s*", "", line).rstrip(":"),
                    "details": []
                }
            elif line.startswith("-") and current_item:
                current_item["details"].append(line[1:].strip())

        if current_item:
            data_points.append(current_item)

        return data_points

    def validate_extraction(self, structured: Dict[str, Any]) -> Dict[str, Any]:
        validation = {"isValid": True, "warnings": [], "errors": []}
        required = ["Chief Complaint", "History of Present Illness"]
        found = [c["category"] for c in structured.get("categories", [])]

        for req in required:
            if not any(req.lower() in f.lower() for f in found):
                validation["warnings"].append(f"Missing expected category: {req}")

        if structured["summary"].get("totalDataPoints", 0) == 0:
            validation["isValid"] = False
            validation["errors"].append("No clinical data points extracted")

        return validation

    def generate_mock_response(self) -> str:
        return """=== CLINICAL DATA EXTRACTION ===

1. Chief Complaint/Reason for Visit:
   - Patient presents with chest pain for 2 days
   - Describes pain as "sharp and stabbing"

2. History of Present Illness (HPI):
   - Onset: 2 days ago, sudden onset
   - Character: Sharp, stabbing pain
   - Location: Left side of chest
   - Severity: 7/10 on pain scale
   - Aggravating factors: Deep breathing, movement
   - Associated symptoms: Shortness of breath

3. Current Medications:
   - Lisinopril 10mg daily for hypertension
   - Metformin 500mg twice daily for diabetes

4. Past Medical History:
   - Hypertension diagnosed 5 years ago
   - Type 2 diabetes diagnosed 3 years ago

=== END OF EXTRACTION ===
"""

# -------------------------------
# Example usage
# -------------------------------

if __name__ == "__main__":
    import asyncio

    async def main():
        service = ExtractionService()
        transcript = "Doctor: How are you feeling today? Patient: I've had chest pain for two days..."
        result = await service.process_transcript(transcript, {"mockResponse": False})
        print(json.dumps(result, indent=2))

    asyncio.run(main())
