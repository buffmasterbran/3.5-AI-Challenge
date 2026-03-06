"use client";

import { useState } from "react";

interface Gift {
  name: string;
  price: string;
  why: string;
  emoji: string;
  buyUrl: string;
}

interface GiftResult {
  gifts: Gift[];
  giftMessage: string;
}

interface DeepQuestion {
  id: string;
  question: string;
  options: string[];
}

// ——— PHASE 1: Quick-fire tappable questions ———
const QUICK_QUESTIONS = [
  {
    id: "relationship",
    emoji: "👤",
    question: "Who are we shopping for?",
    options: ["Partner", "Mom", "Dad", "Sister", "Brother", "Friend", "Coworker", "Grandparent"],
  },
  {
    id: "age",
    emoji: "🎂",
    question: "How old are they?",
    options: ["Under 18", "18–25", "26–35", "36–50", "50–65", "65+"],
  },
  {
    id: "vibe",
    emoji: "✨",
    question: "Pick the vibe that fits them best",
    options: ["Homebody", "Adventurer", "Workaholic", "Life of the party", "Creative soul", "Fitness junkie", "Nerd/Geek", "Bougie"],
  },
  {
    id: "spending",
    emoji: "💰",
    question: "What's their love language with money?",
    options: ["Treats themselves constantly", "Saves everything", "Spends on experiences", "Spends on other people", "Impulse buyer"],
  },
  {
    id: "occasion",
    emoji: "🎉",
    question: "What's the occasion?",
    options: ["Birthday", "Holiday", "Just because", "Thank you", "Anniversary", "New baby", "Graduation"],
  },
];

export default function Home() {
  // Phase tracking
  const [phase, setPhase] = useState<"landing" | "quick" | "loading-deep" | "deep" | "loading-gifts" | "results">("landing");

  // Phase 1 state
  const [quickStep, setQuickStep] = useState(0);
  const [quickAnswers, setQuickAnswers] = useState<Record<string, string>>({});

  // Phase 2 state
  const [deepQuestions, setDeepQuestions] = useState<DeepQuestion[]>([]);
  const [deepStep, setDeepStep] = useState(0);
  const [deepAnswers, setDeepAnswers] = useState<Record<string, string>>({});

  // Results
  const [result, setResult] = useState<GiftResult | null>(null);
  const [error, setError] = useState("");

  // ——— HANDLERS ———
  const handleQuickAnswer = (answer: string) => {
    const q = QUICK_QUESTIONS[quickStep];
    const newAnswers = { ...quickAnswers, [q.id]: answer };
    setQuickAnswers(newAnswers);

    if (quickStep < QUICK_QUESTIONS.length - 1) {
      setQuickStep(quickStep + 1);
    } else {
      // Phase 1 done → fetch deep questions
      fetchDeepQuestions(newAnswers);
    }
  };

  const fetchDeepQuestions = async (answers: Record<string, string>) => {
    setPhase("loading-deep");
    setError("");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quickAnswers: answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setPhase("quick");
        return;
      }
      setDeepQuestions(data.questions);
      setDeepStep(0);
      setPhase("deep");
    } catch {
      setError("Failed to connect. Try again!");
      setPhase("quick");
    }
  };

  const handleDeepAnswer = (answer: string) => {
    const q = deepQuestions[deepStep];
    const newAnswers = { ...deepAnswers, [q.id]: answer };
    setDeepAnswers(newAnswers);

    if (deepStep < deepQuestions.length - 1) {
      setDeepStep(deepStep + 1);
    } else {
      // All done → fetch gifts
      fetchGifts(newAnswers);
    }
  };

  const fetchGifts = async (dAnswers: Record<string, string>) => {
    setPhase("loading-gifts");
    setError("");
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quickAnswers,
          deepAnswers: dAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setPhase("deep");
        return;
      }
      setResult(data);
      setPhase("results");
    } catch {
      setError("Failed to connect. Try again!");
      setPhase("deep");
    }
  };

  const startOver = () => {
    setPhase("landing");
    setQuickStep(0);
    setQuickAnswers({});
    setDeepQuestions([]);
    setDeepStep(0);
    setDeepAnswers({});
    setResult(null);
    setError("");
  };

  // ——— LANDING ———
  if (phase === "landing") {
    return (
      <main className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-6">🎁</div>
          <h1 className="text-4xl font-bold mb-3">Nailed It</h1>
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
            A few quick taps about who they are. Then we go deeper.
            You&apos;ll get 5 gifts so good they&apos;ll say{" "}
            <span className="text-amber-400 italic">&quot;you get me.&quot;</span>
          </p>
          <button
            onClick={() => setPhase("quick")}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-8 py-4 rounded-2xl transition text-lg cursor-pointer active:scale-95 w-full"
          >
            Let&apos;s Go
          </button>
        </div>
      </main>
    );
  }

  // ——— PHASE 1: Quick-fire tappable ———
  if (phase === "quick") {
    const q = QUICK_QUESTIONS[quickStep];
    const progress = ((quickStep + 1) / QUICK_QUESTIONS.length) * 50; // 0-50%

    return (
      <main className="min-h-screen flex flex-col px-5 py-6">
        {/* Progress */}
        <div className="max-w-sm mx-auto w-full mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (quickStep > 0) setQuickStep(quickStep - 1);
                else setPhase("landing");
              }}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition cursor-pointer"
            >
              ← Back
            </button>
            <span className="text-zinc-600 text-xs uppercase tracking-wider">Quick round</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="mb-6">
            <span className="text-4xl mb-3 block">{q.emoji}</span>
            <h2 className="text-2xl font-bold">{q.question}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {q.options.map((option) => (
              <button
                key={option}
                onClick={() => handleQuickAnswer(option)}
                className={`p-4 rounded-2xl text-left font-medium transition cursor-pointer active:scale-95 border ${
                  quickAnswers[q.id] === option
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-600"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 text-red-400 text-sm text-center">{error}</div>
          )}
        </div>
      </main>
    );
  }

  // ——— LOADING: Deep questions ———
  if (phase === "loading-deep") {
    return (
      <main className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-5xl mb-5 animate-pulse">🤔</div>
          <h2 className="text-xl font-bold mb-2">Now let&apos;s get specific...</h2>
          <p className="text-zinc-400 text-sm">Crafting questions just for them</p>
          <div className="mt-6 flex justify-center">
            <svg className="animate-spin h-7 w-7 text-amber-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      </main>
    );
  }

  // ——— PHASE 2: Deep questions (tappable options from AI) ———
  if (phase === "deep" && deepQuestions.length > 0) {
    const q = deepQuestions[deepStep];
    const progress = 50 + ((deepStep + 1) / deepQuestions.length) * 50; // 50-100%

    return (
      <main className="min-h-screen flex flex-col px-5 py-6">
        {/* Progress */}
        <div className="max-w-sm mx-auto w-full mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (deepStep > 0) setDeepStep(deepStep - 1);
              }}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition cursor-pointer"
            >
              {deepStep > 0 ? "← Back" : ""}
            </button>
            <span className="text-zinc-600 text-xs uppercase tracking-wider">Getting personal</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-xl font-bold leading-snug">{q.question}</h2>
          </div>

          <div className="flex flex-col gap-3">
            {q.options.map((option) => (
              <button
                key={option}
                onClick={() => handleDeepAnswer(option)}
                className={`p-4 rounded-2xl text-left font-medium transition cursor-pointer active:scale-95 border ${
                  deepAnswers[q.id] === option
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-600"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 text-red-400 text-sm text-center">{error}</div>
          )}
        </div>
      </main>
    );
  }

  // ——— LOADING: Gifts ———
  if (phase === "loading-gifts") {
    return (
      <main className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-6xl mb-5 animate-bounce">🎁</div>
          <h2 className="text-xl font-bold mb-2">Finding the perfect gifts...</h2>
          <p className="text-zinc-400 text-sm">Curating picks they&apos;ll actually love</p>
          <div className="mt-6 flex justify-center">
            <svg className="animate-spin h-7 w-7 text-amber-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      </main>
    );
  }

  // ——— RESULTS ———
  if (phase === "results" && result) {
    return (
      <main className="max-w-lg mx-auto px-5 py-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          🎯 5 Gifts They&apos;ll Love
        </h2>

        <div className="space-y-4">
          {result.gifts.map((gift, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/50 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl shrink-0 mt-0.5">{gift.emoji}</span>
                  <h3 className="font-semibold text-base text-zinc-100 leading-snug">
                    {gift.name}
                  </h3>
                </div>
                <span className="text-amber-400 font-bold text-lg shrink-0">
                  {gift.price}
                </span>
              </div>
              <p className="text-zinc-400 text-sm mb-4 ml-9">{gift.why}</p>
              <a
                href={gift.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-9 inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2.5 rounded-xl text-sm font-medium transition active:scale-95"
              >
                Buy on Amazon →
              </a>
            </div>
          ))}
        </div>

        {/* Gift Message */}
        {result.giftMessage && (
          <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              💌 Gift Message
            </h3>
            <p className="text-zinc-300 italic leading-relaxed text-sm">
              &quot;{result.giftMessage}&quot;
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(result.giftMessage)}
              className="mt-3 text-sm text-zinc-500 hover:text-amber-400 transition cursor-pointer active:scale-95"
            >
              📋 Copy message
            </button>
          </div>
        )}

        <div className="text-center pt-6">
          <button
            onClick={startOver}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition cursor-pointer"
          >
            ← Find gifts for someone else
          </button>
        </div>
      </main>
    );
  }

  // Fallback
  return null;
}
