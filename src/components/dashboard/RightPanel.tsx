export default function RightPanel() {
  return (
    <div className="sticky top-24 space-y-5">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#6D28D9] to-[#06B6D4]" />

          <div>
            <h3 className="font-bold text-lg">
              Chukwudi
            </h3>

            <p className="text-slate-400 text-sm">
              Level 8 Student
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm text-slate-400">
            XP Progress
          </p>

          <div className="h-3 bg-slate-800 rounded-full mt-2">
            <div className="h-3 w-[62%] rounded-full bg-gradient-to-r from-[#6D28D9] to-[#06B6D4]" />
          </div>

          <p className="text-sm mt-2">
            1250 / 2000 XP
          </p>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <h3 className="font-bold mb-4">
          Learning Summary
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Current Streak</span>
            <span>🔥 7 Days</span>
          </div>

          <div className="flex justify-between">
            <span>Subjects Active</span>
            <span>6</span>
          </div>

          <div className="flex justify-between">
            <span>Lessons Completed</span>
            <span>42</span>
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
        <h3 className="font-bold mb-4">
          Recent Activity
        </h3>

        <div className="space-y-4 text-sm">
          <div>
            <p>Physics Lesson Completed</p>
            <span className="text-slate-500">
              2 hours ago
            </span>
          </div>

          <div>
            <p>Mathematics Quiz</p>
            <span className="text-slate-500">
              Yesterday
            </span>
          </div>

          <div>
            <p>Nova AI Session</p>
            <span className="text-slate-500">
              Yesterday
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-gradient-to-r from-[#6D28D9] to-[#06B6D4]">
        <h3 className="font-bold">
          Nova Tip
        </h3>

        <p className="mt-2 text-sm">
          Your strongest subject is English.
          Focus on Physics this week for
          maximum improvement.
        </p>
      </div>
    </div>
  );
}