type Props = {
  onSelect: (prompt: string) => void;
};

export default function SuggestedPrompts({
  onSelect,
}: Props) {
  const prompts = [
    "Explain photosynthesis",
    "Solve x² + 5x + 6",
    "Summarize Newton's Laws",
    "Create a Biology quiz",
  ];

  return (
    <div className="flex flex-wrap gap-3 my-5">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="
          px-4
          py-2
          rounded-full
          bg-slate-800
          hover:bg-slate-700
          text-sm
          transition
          "
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}