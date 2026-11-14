"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  RotateCcw,
  Shuffle,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  cards: FlashcardItem[];
  loading?: boolean;
  generatedByAi?: boolean;
}

export default function FlashcardDeckModal({
  open,
  onClose,
  title,
  subject,
  cards,
  loading = false,
  generatedByAi = false,
}: Props) {
  const [deck, setDeck] = useState<FlashcardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  if (!open) return null;

  const activeDeck = deck.length > 0 ? deck : cards;
  const currentCard = activeDeck[index] || activeDeck[0];

  const handleNext = () => {
    setFlipped(false);
    setIndex((i) => (i + 1 >= activeDeck.length ? 0 : i + 1));
  };

  const handlePrev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 < 0 ? activeDeck.length - 1 : i - 1));
  };

  const handleShuffle = () => {
    const copy = [...activeDeck];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setDeck(copy);
    setIndex(0);
    setFlipped(false);
  };

  const toggleMastered = () => {
    if (!currentCard) return;
    setMasteredIds((prev) =>
      prev.includes(currentCard.id)
        ? prev.filter((id) => id !== currentCard.id)
        : [...prev, currentCard.id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070D24]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E4E1F5] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="learnova-banner-dark px-6 py-4 text-white flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#22D3EE] flex items-center gap-1.5">
              <Layers size={13} />
              Study Flashcards · {subject}
              {generatedByAi ? " · Nova AI" : ""}
            </p>
            <h3 className="landing-display text-base font-extrabold truncate mt-0.5">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeck([]);
              setIndex(0);
              setFlipped(false);
              onClose();
            }}
            aria-label="Close flashcards"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 size={28} className="animate-spin text-[#4F46E5] mx-auto" />
              <p className="text-sm font-semibold text-[#0B1230]">
                Creating interactive revision flashcards...
              </p>
              <p className="text-xs text-[#6B6F94]">
                Distilling key definitions, formulas, and exam recall prompts.
              </p>
            </div>
          ) : !currentCard ? (
            <div className="py-12 text-center text-sm text-[#6B6F94]">
              No flashcard items available for this note yet.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-[#6B6F94]">
                <span className="font-bold text-[#0B1230] tabular-nums">
                  Card {index + 1} of {activeDeck.length}
                </span>
                <span className="tabular-nums text-[#4F46E5] font-semibold">
                  {masteredIds.length} / {activeDeck.length} Mastered
                </span>
              </div>

              {/* Flip Card Surface */}
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className={`w-full min-h-[220px] rounded-2xl border p-6 sm:p-8 text-left flex flex-col justify-between transition ${
                  flipped
                    ? "bg-[#F5F3FF] border-[#7C3AED]"
                    : "bg-[#FAF8FF] border-[#E4E1F5] hover:border-[#4F46E5]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className={flipped ? "text-[#6D28D9]" : "text-[#6B6F94]"}>
                    {flipped ? "Answer / Concept Explanation" : "Prompt / Recall Question"}
                  </span>
                  {currentCard.hint && (
                    <span className="text-[#6B6F94] font-semibold normal-case">
                      {currentCard.hint}
                    </span>
                  )}
                </div>

                <p className="text-lg sm:text-xl font-bold text-[#0B1230] leading-relaxed my-4">
                  {flipped ? currentCard.back : currentCard.front}
                </p>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5]">
                  <RotateCcw size={13} />
                  Click card to flip {flipped ? "to question" : "to reveal answer"}
                </span>
              </button>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-3.5 py-2 rounded-xl border border-[#DCD7F5] bg-white hover:bg-[#FAF8FF] text-xs font-bold text-[#0B1230] inline-flex items-center gap-1 transition"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-3.5 py-2 rounded-xl border border-[#DCD7F5] bg-white hover:bg-[#FAF8FF] text-xs font-bold text-[#0B1230] inline-flex items-center gap-1 transition"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="px-3 py-2 rounded-xl border border-[#DCD7F5] bg-white hover:bg-[#FAF8FF] text-xs font-semibold text-[#43466E] inline-flex items-center gap-1 transition"
                  >
                    <Shuffle size={13} /> Shuffle
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleMastered}
                  className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${
                    masteredIds.includes(currentCard.id)
                      ? "bg-[#059669] text-white"
                      : "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white"
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {masteredIds.includes(currentCard.id) ? "Mastered" : "Got It"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
