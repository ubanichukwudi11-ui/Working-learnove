import AppLayout from "@/components/layout/AppLayout";

const students = [
  {
    id: 1,
    name: "Chukwudi Ubani",
    email: "chukwudi@learnova.com",
    class: "SS1 Science",
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "John Daniel",
    email: "john@learnova.com",
    class: "SS2 Science",
    status: "ACTIVE",
  },
  {
    id: 3,
    name: "Grace Emmanuel",
    email: "grace@learnova.com",
    class: "SS1 Art",
    status: "SUSPENDED",
  },
];

export default function AdminStudentsPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Student Management
          </h1>

          <p className="text-slate-400 mt-2">
            View, manage and monitor all students.
          </p>
        </div>

        {/* Statistics */}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400">
              Total Students
            </p>

            <h2 className="text-4xl font-bold mt-2">
              1,248
            </h2>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400">
              Active Students
            </p>

            <h2 className="text-4xl font-bold mt-2 text-green-400">
              1,203
            </h2>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400">
              Suspended Students
            </p>

            <h2 className="text-4xl font-bold mt-2 text-red-400">
              45
            </h2>
          </div>
        </div>

        {/* Student Table */}

        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-800">
              <tr>
                <th className="text-left p-4">
                  Name
                </th>

                <th className="text-left p-4">
                  Email
                </th>

                <th className="text-left p-4">
                  Class
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-left p-4">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-800"
                >
                  <td className="p-4">
                    {student.name}
                  </td>

                  <td className="p-4 text-slate-400">
                    {student.email}
                  </td>

                  <td className="p-4">
                    {student.class}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        student.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500">
                        View
                      </button>

                      {student.status === "ACTIVE" ? (
                        <button className="px-3 py-2 bg-red-600 rounded-lg hover:bg-red-500">
                          Suspend
                        </button>
                      ) : (
                        <button className="px-3 py-2 bg-green-600 rounded-lg hover:bg-green-500">
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}