"use client";


import {
Sparkles,
Brain,
FileText,
HelpCircle,
Wand2
} from "lucide-react";



const actions=[

{
title:"Explain",
description:"Explain this topic simply",
icon:Brain
},

{
title:"Summarize",
description:"Create quick revision notes",
icon:FileText
},

{
title:"Create Quiz",
description:"Generate practice questions",
icon:HelpCircle
},

{
title:"Improve Notes",
description:"Make notes clearer",
icon:Wand2
}

];





export default function NovaNotebookPanel() {
  return (
    <aside className="learnova-card p-5 h-fit sticky top-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-sm">
          <Sparkles size={20} className="text-white" />
        </div>

        <div>
          <h2 className="landing-display font-bold text-[var(--foreground)]">Nova</h2>
          <p className="text-xs text-[var(--foreground-subtle)]">Notebook Assistant</p>
        </div>
      </div>

      <p className="text-sm text-[var(--foreground-muted)] mb-5">
        How can I help improve your notes?
      </p>

      {/* Actions */}
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              type="button"
              className="w-full text-left bg-[var(--surface-lavender)] border border-[var(--border)] rounded-xl p-4 hover:border-violet-500 hover:bg-violet-50/70 dark:hover:bg-violet-950/40 transition"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />

                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {action.title}
                  </h3>
                  <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* AI Status */}
      <div className="mt-6 learnova-banner-dark rounded-xl p-4">
        <p className="text-xs text-slate-200 flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#22D3EE] shrink-0" />
          Nova is ready to help you learn faster.
        </p>
      </div>
    </aside>
  );
}