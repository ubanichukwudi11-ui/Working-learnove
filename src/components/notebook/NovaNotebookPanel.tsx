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
          <h2 className="landing-display font-bold text-[#0B1230]">Nova</h2>
          <p className="text-xs text-[#6B6F94]">Notebook Assistant</p>
        </div>
      </div>

      <p className="text-sm text-[#43466E] mb-5">
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
              className="w-full text-left bg-[#FAF8FF] border border-[#E4E1F5] rounded-xl p-4 hover:border-[#7C3AED] hover:bg-[#F5F3FF] transition"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-[#4F46E5] shrink-0" />

                <div>
                  <h3 className="text-sm font-semibold text-[#0B1230]">
                    {action.title}
                  </h3>
                  <p className="text-xs text-[#6B6F94] mt-0.5">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* AI Status */}
      <div className="mt-6 rounded-xl bg-[#0B1230] border border-[#1E2756] p-4">
        <p className="text-xs text-slate-200 flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#22D3EE] shrink-0" />
          Nova is ready to help you learn faster.
        </p>
      </div>
    </aside>
  );
}