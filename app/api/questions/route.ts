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

These questions should feel like a friend asking "wait, tell me more..." — conversational, specific, and fun. NOT generic. NOT yes/no questions.

Each question needs:
- 3-4 tappable answer options that are vivid and specific (not generic). These should cover the most likely answers for this type of person.
- A placeholder hint for a free-text fallback in case none of the options fit.

The questions should help uncover:
- Their personality quirks and daily habits
- What they're obsessed with or into right now
- How they actually spend their free time / guilty pleasures
- Their taste, aesthetic, or style
- What they'd love but would never buy themselves

Make options feel vivid and real. Instead of "They like cooking", try "They've got 3 cookbooks open and a sourdough starter named Gerald."

Respond with this exact JSON structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "The conversational question here?",
      "options": ["Vivid option A", "Vivid option B", "Vivid option C"],
      "placeholder": "e.g. She rewatches The Office every night and eats Hot Cheetos in bed"
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
