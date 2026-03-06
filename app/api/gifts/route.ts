import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { quickAnswers, deepAnswers } = await req.json();

    if (!quickAnswers || !deepAnswers) {
      return NextResponse.json(
        { error: "Missing answer data" },
        { status: 400 }
      );
    }

    // Build a rich description from both phases
    const quickParts = Object.entries(quickAnswers)
      .map(([key, val]) => `${key}: ${val}`)
      .join(". ");

    const deepParts = Object.entries(deepAnswers)
      .map(([, val]) => val)
      .join(". ");

    const description = `Quick profile: ${quickParts}. Deeper insights: ${deepParts}.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite gift curator who thinks like the editors at Wirecutter, GQ, Bon Appétit, and Buzzfeed gift guides. You receive a detailed profile of a real person and return 5 HYPER-SPECIFIC gift ideas that would make them say "You get me."

YOUR SOURCING APPROACH:
- Think like a gift guide editor: recommend products that have been featured in curated listicles, "best of" roundups, and editorial gift guides.
- Prioritize products from well-known brands that get recommended by taste-makers and reviewers — the kind of stuff that shows up in "Best Gifts for [Type of Person]" articles.
- Every product should be something a real person could find and buy TODAY.

RULES:
- ZERO generic gifts. No "nice candle", no "gift card", no "cozy blanket", no "journal", no "subscription box." Every gift must be a SPECIFIC product with a real brand/maker name.
- Each gift MUST connect directly to something specific from their profile — not just vaguely related.
- Include a realistic price estimate in USD.
- Include a "why" — one sentence that connects the gift to something specific about this person. Make it feel personal.
- Include an Amazon search query that would find this exact product.
- Mix up the price range: include at least one under $30 and one splurge option.
- Write a gift message (2-3 sentences) that sounds like it was written by someone who actually knows this person — warm, specific, maybe a little funny. Reference real details from their profile.

Respond with this exact JSON:
{
  "gifts": [
    {
      "name": "Specific Product Name by Brand",
      "price": "$XX",
      "why": "One sentence connecting to this specific person",
      "searchQuery": "exact amazon search terms",
      "emoji": "one fitting emoji"
    }
  ],
  "giftMessage": "The personalized gift message."
}`,
        },
        {
          role: "user",
          content: description,
        },
      ],
      temperature: 1,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate gifts. Try again!" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    const giftsWithLinks = parsed.gifts.map(
      (gift: {
        name: string;
        price: string;
        why: string;
        searchQuery: string;
        emoji: string;
      }) => ({
        ...gift,
        buyUrl: `https://www.amazon.com/s?k=${encodeURIComponent(gift.searchQuery)}`,
      })
    );

    // Save to DB (non-blocking)
    prisma.search
      .create({
        data: {
          description,
          gifts: giftsWithLinks,
          giftMessage: parsed.giftMessage,
        },
      })
      .catch((e: unknown) => console.error("DB save failed:", e));

    return NextResponse.json({
      gifts: giftsWithLinks,
      giftMessage: parsed.giftMessage,
    });
  } catch (error) {
    console.error("Gift generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Try again!" },
      { status: 500 }
    );
  }
}
