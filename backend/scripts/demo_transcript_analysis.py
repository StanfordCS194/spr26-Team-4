"""
Demo script for the transcript analysis backend.

Run this from the backend folder with:

    python scripts/demo_transcript_analysis.py

This script directly calls the transcript analysis service so the team can see
sample structured feedback without needing to run the frontend.
"""

import asyncio
import json
from typing import Any

from app.models.transcript import TranscriptAnalysisRequest
from app.services.transcript_service import analyze_transcript


STRONG_BEHAVIORAL_TRANSCRIPT = """
During my internship, I noticed that our internal dashboard was difficult for
teammates to use when they needed to find project data quickly. My task was to
improve the dashboard experience without disrupting the team's existing workflow.
I talked to a few users, identified the filters they used most often, and built
a new filtering system that made the most important information easier to access.
As a result, the team reduced manual search time by about 30 percent and several
teammates said the dashboard felt much easier to use.
"""


WEAK_BEHAVIORAL_TRANSCRIPT = """
I worked on a project with my team and helped with some parts of it. It was a
good experience because I learned a lot and worked with other people. I think I
did a good job overall and helped the team finish what we needed to do.
"""


FILLER_HEAVY_TRANSCRIPT = """
Um, I basically worked on this project where, like, we had to make something for
users. I kind of helped with the design and, you know, also did some coding. It
was pretty good because we were able to finish it and stuff.
"""


TECHNICAL_PROJECT_TRANSCRIPT = """
In my software engineering project, our team needed to improve the backend
structure for an interview preparation app. I worked on the models and routes
that connected frontend requests to backend services. I helped define the data
shape for resume parsing and report scoring, then connected those request models
to FastAPI routes. This made the backend easier to understand because each route
had a clear request type, response type, and service function.
"""


def print_section(title: str) -> None:
    """Print a clean divider for each demo case."""
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def print_json(data: dict[str, Any]) -> None:
    """Print JSON output in a readable format."""
    print(json.dumps(data, indent=2))


async def run_single_demo(name: str, transcript: str, target_role: str) -> None:
    """
    Run one transcript through the analysis service and print the result.
    """
    print_section(name)

    payload = TranscriptAnalysisRequest(
        transcript=transcript,
        targetRole=target_role,
    )

    result = await analyze_transcript(payload)

    print_json(result.model_dump())


async def run_error_demo() -> None:
    """
    Show what happens when the transcript is invalid.
    """
    print_section("Invalid Transcript Demo")

    payload = TranscriptAnalysisRequest(
        transcript="",
        targetRole="Software Engineer",
    )

    try:
        await analyze_transcript(payload)
    except ValueError as error:
        print("The backend correctly rejected the transcript.")
        print(f"Error message: {error}")


async def main() -> None:
    """
    Run several sample transcripts through the transcript analysis backend.
    """
    await run_single_demo(
        name="Strong Behavioral Answer",
        transcript=STRONG_BEHAVIORAL_TRANSCRIPT,
        target_role="Software Engineer",
    )

    await run_single_demo(
        name="Weak Behavioral Answer",
        transcript=WEAK_BEHAVIORAL_TRANSCRIPT,
        target_role="Software Engineer",
    )

    await run_single_demo(
        name="Filler-Heavy Answer",
        transcript=FILLER_HEAVY_TRANSCRIPT,
        target_role="Software Engineer",
    )

    await run_single_demo(
        name="Technical Project Answer",
        transcript=TECHNICAL_PROJECT_TRANSCRIPT,
        target_role="Backend Engineer",
    )

    await run_error_demo()


if __name__ == "__main__":
    asyncio.run(main())