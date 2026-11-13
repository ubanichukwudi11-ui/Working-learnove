type Props = {
  onSelect: (prompt: string) => void;
};

export default function SuggestedPrompts({ onSelect }: Props) {
  const prompts = [
    "Explain quadratic equation roots & vertex (WAEC)",
    "Summarize Newton's Laws with Nigerian traffic examples",
    "Set 3 JAMB Chemistry questions on Alkanes",
    "Tips for WAEC English summary writing",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-[#F7F8FA] hover:bg-white hover:border-[#0D9488] text-xs font-semibold text-[#0B1F3A] transition"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}