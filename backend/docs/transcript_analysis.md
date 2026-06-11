# Transcript Analysis Backend

## Purpose

The transcript analysis backend supports StarReady's goal of helping users improve their behavioral interview answers after each practice session. The feature takes a user's interview transcript and turns it into structured feedback that can be displayed in the final report.

This makes the transcript more useful than a plain record of what the user said. Instead, the transcript becomes the source for measurable feedback, STAR-structure analysis, filler word detection, strengths, and improvement areas.

## Product Motivation

During testing, users wanted the AI feedback to be more specific. Generic feedback is not enough because users need to know exactly what they did well and what they should improve before their next interview.

The transcript analysis feature helps solve this by looking at the actual words in the user's answer. It can identify whether the user gave enough context, explained their actions clearly, included measurable impact, used too many filler words, or missed parts of a strong STAR-style response.

## How This Fits Into StarReady

StarReady is an AI-powered behavioral interview practice app. The user completes a live interview, the app captures or stores the transcript, and the backend can analyze that transcript to generate feedback.

The intended user flow is:

1. The user starts an AI interview.
2. The user answers questions out loud.
3. The frontend captures the transcript.
4. The frontend sends the transcript to the backend.
5. The backend analyzes the transcript.
6. The frontend displays the results in the feedback report.

## Endpoint

The planned backend route is:
POST /api/transcript/analyze

## Example Request
{
  "transcript": "During my internship, I noticed that our team dashboard was difficult to use. My task was to improve the way users filtered information. I built a new filtering system and reorganized the layout. As a result, users were able to find data faster and the team reduced manual search time by 30 percent.",
  "targetRole": "Software Engineer"
}

## Example Response
{
  "metrics": {
    "wordCount": 52,
    "sentenceCount": 4,
    "estimatedSpeakingSeconds": 21,
    "averageSentenceLength": 13.0,
    "fillerWordCount": 0,
    "fillerWordsDetected": []
  },
  "starSignals": [
    {
      "category": "situation",
      "detected": true,
      "evidence": ["during", "noticed"]
    },
    {
      "category": "task",
      "detected": true,
      "evidence": ["task"]
    },
    {
      "category": "action",
      "detected": true,
      "evidence": ["built", "reorganized"]
    },
    {
      "category": "result",
      "detected": true,
      "evidence": ["as a result", "30 percent"]
    }
  ],
  "strengths": [
    "The response includes a clear action and result.",
    "The answer includes measurable impact."
  ],
  "improvementAreas": [
    "Add more detail about the specific challenge and why the work mattered."
  ],
  "specificityScore": 8,
  "clarityScore": 8
}

## Main Data Fields
## Transcript

The transcript is the raw text of what the user said during the interview. This is the main input for the analysis service.

## Target Role

The target role is optional context about what type of job the user is preparing for. In future versions, this can help the backend provide more role-specific feedback.

## Metrics

Metrics are objective measurements based on the transcript. These can include word count, sentence count, estimated speaking time, average sentence length, filler word count, and detected filler words.

## STAR Signals

STAR signals check whether the response includes the major parts of a strong behavioral interview answer: Situation, Task, Action, and Result. This matters because many behavioral interview answers are stronger when the user gives context, explains their responsibility, describes what they did, and ends with a result.

## Strengths

Strengths identify what the user did well. This makes the feedback more encouraging and helps users understand what they should keep doing.

## Improvement Areas

Improvement areas identify what the user should work on next. These should be specific enough to guide the user's next practice attempt.

## Specificity Score

The specificity score estimates whether the answer includes concrete details. Strong answers usually include examples, numbers, outcomes, role-specific context, or clear actions.

## Clarity Score

The clarity score estimates whether the answer is easy to follow. Clear answers tend to have understandable sentence structure, fewer filler words, and a logical flow.

## Relationship to Issue #20

Issue #20 focuses on adding real-time transcript support during the interview. The transcript analysis backend does not replace the frontend transcript component. Instead, it gives the project a backend path for using transcript text once it exists.

Once the frontend has transcript text, it can send that text to this backend service for analysis. This makes the transcript useful for feedback, reporting, and future progress tracking.

## Implementation Approach

The first version of this feature can use rule-based analysis. This means the backend can detect basic patterns such as filler words, STAR keywords, action verbs, numbers, and result-oriented phrases. This approach is useful because it is fast, predictable, and does not require a separate AI model call.

A future version can combine rule-based analysis with LLM feedback. The rule-based part can provide stable metrics, while the LLM can provide more personalized comments about the user's answer quality.

## Backend Architecture

The transcript feature follows the same structure as the rest of the backend.

The models folder defines the request and response data shapes. This helps make sure the frontend sends the correct type of data and receives a predictable response.

The routes folder exposes the API endpoint that the frontend can call. The route receives the request, passes it to the service layer, and returns the response.

The services folder contains the actual transcript analysis logic. This keeps the route simple and makes the analysis easier to test.

## Testing Plan

The transcript analysis feature should be tested with several types of sample transcripts. Strong behavioral answers should produce higher specificity and clarity scores. Weak or vague answers should produce more improvement areas. Filler-heavy answers should detect filler words. STAR-style answers should detect situation, task, action, and result signals.

The route should also be tested to make sure valid requests return a successful response and invalid requests return helpful error messages.

## Future Improvements

Future versions of transcript analysis could support question-by-question feedback instead of only analyzing the full transcript. This would allow users to see which specific answers were strong or weak.

Another future improvement would be role-aware feedback. For example, a software engineering answer might be evaluated differently from a consulting answer or finance answer.

The feature could also support progress tracking over time. If users complete multiple interviews, StarReady could show whether their clarity, specificity, confidence, or STAR structure improves across sessions.

## Known Limitations

The first version of transcript analysis may not fully understand the meaning of every answer. Rule-based detection can identify useful patterns, but it may miss strong answers that do not use obvious keywords.

The STAR signal detection may also produce false positives or false negatives. For example, a user may explain an action without using the word "built" or "implemented." A future LLM-based version can make this more flexible.

The estimated speaking time is also only an approximation. It is based on average speaking speed and may not match the user's exact pace.

## Summary

The transcript analysis backend supports StarReady's mission by helping users turn interview practice into measurable improvement. It gives the product a way to analyze what users actually said, identify strengths, point out improvement areas, and support future features like live transcripts, feedback reports, and progress tracking.