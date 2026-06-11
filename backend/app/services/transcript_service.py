import re
from collections import Counter

from app.models.transcript import (
    StarSignal,
    TranscriptAnalysisRequest,
    TranscriptAnalysisResponse,
    TranscriptMetrics,
)


FILLER_WORDS = {
    "um",
    "uh",
    "like",
    "basically",
    "actually",
    "literally",
    "kind of",
    "sort of",
    "you know",
    "i guess",
}

STAR_KEYWORDS = {
    "situation": [
        "situation",
        "context",
        "background",
        "when i was",
        "during",
        "at the time",
    ],
    "task": [
        "task",
        "goal",
        "responsible",
        "needed to",
        "my role",
        "objective",
    ],
    "action": [
        "i did",
        "i built",
        "i created",
        "i worked",
        "i implemented",
        "i decided",
        "i led",
        "i organized",
    ],
    "result": [
        "result",
        "impact",
        "outcome",
        "improved",
        "increased",
        "reduced",
        "learned",
        "success",
    ],
}


def _split_sentences(text: str) -> list[str]:
    sentences = re.split(r"[.!?]+", text)
    return [sentence.strip() for sentence in sentences if sentence.strip()]


def _split_words(text: str) -> list[str]:
    return re.findall(r"\b[a-zA-Z']+\b", text.lower())


def _find_filler_words(text: str) -> list[str]:
    lowered = text.lower()
    detected: list[str] = []

    for filler in FILLER_WORDS:
        pattern = r"\b" + re.escape(filler) + r"\b"
        matches = re.findall(pattern, lowered)
        detected.extend(matches)

    return detected


def _detect_star_signals(text: str) -> list[StarSignal]:
    lowered = text.lower()
    signals: list[StarSignal] = []

    for category, keywords in STAR_KEYWORDS.items():
        evidence = [keyword for keyword in keywords if keyword in lowered]
        signals.append(
            StarSignal(
                category=category,
                detected=len(evidence) > 0,
                evidence=evidence[:5],
            )
        )

    return signals


def _score_specificity(text: str, words: list[str]) -> int:
    specificity_points = 0

    if re.search(r"\d+%|\d+\s*(users|people|students|customers|seconds|minutes|hours)", text.lower()):
        specificity_points += 3

    if any(word in words for word in ["because", "therefore", "so", "which", "result"]):
        specificity_points += 2

    if any(word in words for word in ["built", "implemented", "designed", "led", "created"]):
        specificity_points += 2

    if len(words) >= 80:
        specificity_points += 2

    if len(words) >= 140:
        specificity_points += 1

    return max(1, min(10, specificity_points))


def _score_clarity(sentences: list[str], filler_count: int, word_count: int) -> int:
    if word_count == 0:
        return 1

    score = 8

    if not sentences:
        return 1

    average_sentence_length = word_count / len(sentences)

    if average_sentence_length > 30:
        score -= 2

    if average_sentence_length < 6:
        score -= 1

    if filler_count >= 5:
        score -= 2
    elif filler_count >= 2:
        score -= 1

    return max(1, min(10, score))


def _build_strengths(star_signals: list[StarSignal], specificity_score: int, clarity_score: int) -> list[str]:
    strengths: list[str] = []

    detected_categories = [signal.category for signal in star_signals if signal.detected]

    if len(detected_categories) >= 3:
        strengths.append("The response includes several parts of the STAR structure.")

    if specificity_score >= 7:
        strengths.append("The response includes specific details that make the example stronger.")

    if clarity_score >= 7:
        strengths.append("The response is generally clear and easy to follow.")

    if not strengths:
        strengths.append("The response provides a starting point that can be improved with more structure and detail.")

    return strengths


def _build_improvement_areas(star_signals: list[StarSignal], specificity_score: int, clarity_score: int) -> list[str]:
    improvements: list[str] = []

    missing_categories = [signal.category for signal in star_signals if not signal.detected]

    if missing_categories:
        improvements.append(
            "Add clearer STAR structure, especially: " + ", ".join(missing_categories[:3]) + "."
        )

    if specificity_score < 7:
        improvements.append("Add more concrete details, metrics, examples, or measurable impact.")

    if clarity_score < 7:
        improvements.append("Make the answer more concise and reduce filler language.")

    if not improvements:
        improvements.append("The answer is solid; the next step is making the impact even more memorable.")

    return improvements[:3]


async def analyze_transcript(payload: TranscriptAnalysisRequest) -> TranscriptAnalysisResponse:
    transcript = payload.transcript.strip()

    if not transcript:
        raise ValueError("Transcript is empty.")

    words = _split_words(transcript)
    sentences = _split_sentences(transcript)
    filler_words = _find_filler_words(transcript)
    filler_counter = Counter(filler_words)

    word_count = len(words)
    sentence_count = len(sentences)
    estimated_speaking_seconds = round((word_count / 150) * 60)

    average_sentence_length = round(word_count / sentence_count, 2) if sentence_count else 0.0

    star_signals = _detect_star_signals(transcript)
    specificity_score = _score_specificity(transcript, words)
    clarity_score = _score_clarity(sentences, len(filler_words), word_count)

    metrics = TranscriptMetrics(
        wordCount=word_count,
        sentenceCount=sentence_count,
        estimatedSpeakingSeconds=estimated_speaking_seconds,
        fillerWordCount=len(filler_words),
        fillerWordsDetected=list(filler_counter.keys()),
        averageSentenceLength=average_sentence_length,
    )

    return TranscriptAnalysisResponse(
        metrics=metrics,
        starSignals=star_signals,
        strengths=_build_strengths(star_signals, specificity_score, clarity_score),
        improvementAreas=_build_improvement_areas(star_signals, specificity_score, clarity_score),
        specificityScore=specificity_score,
        clarityScore=clarity_score,
    )