import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { quickAnswers } = await req.json();

    if (!quickAnswers || Object.keys(quickAnswers).length === 0) {
      return NextResponse.json(
        { error: "No answers provided" },
        { status: 400 }
      );
    }

    const context = Object.entries(quickAnswers)
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You're helping someone find the perfect gift. Based on basic info about the recipient, generate exactly 5 follow-up questions that dig deeper into WHO this person really is.

These questions should feel like a friend asking "wait, tell me more..." — conversational, specific, and fun. NOT generic. Each question should have 3-4 tappable answer options that feel real and specific.

The questions should help uncover:
- Their personality quirks and habits
- What they're obsessed with right now
- How they spend their free time / guilty pleasures
- Their aesthetic or style preferences
- What they'd never buy themselves but secretly want

Make the answer options vivid and specific — not generic. Instead of "They like reading", try "They've got 3 books going and won't shut up about the one they just finished."

Respond with this exact JSON structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "The conversational question here?",
      "options": ["Vivid option A", "Vivid option B", "Vivid option C", "Vivid option D"]
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Here's what I know so far: ${context}`,
        },
      ],
      temperature: 1,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({ questions: parsed.questions });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
