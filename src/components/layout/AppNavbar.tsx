"use client";

import {
  Bell,
  LogOut,
  Search,
} from "lucide-react";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
};

type Props = {
  user: User;
  onLogout: () => void;
};

export default function AppNavbar({
  user,
  onLogout,
}: Props) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const roleColor = () => {
    switch (user.role) {
      case "ADMIN":
        return "bg-red-500/20 text-red-400 border-red-500/30";

      case "TEACHER":
        return "bg-green-500/20 text-green-400 border-green-500/30";

      case "PARENT":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";

      default:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    }
  };

  return (
    <header
      className="
      fixed
      top-0
      right-0
      left-20
      h-20
      z-40
      bg-[#0F172A]/90
      backdrop-blur
      border-b
      border-slate-800
      flex
      items-center
      justify-between
      px-6
      "
    >
      {/* Search */}

      <div
        className="
        flex
        items-center
        gap-3
        bg-[#111827]
        border
        border-slate-800
        rounded-2xl
        px-4
        py-3
        w-full
        max-w-xl
        "
      >
        <Search
          size={18}
          className="text-slate-400"
        />

        <input
          placeholder="Search..."
          className="
          bg-transparent
          outline-none
          text-sm
          text-white
          w-full
          placeholder:text-slate-500
          "
        />
      </div>

      {/* Right */}

      <div
        className="
        flex
        items-center
        gap-5
        "
      >
        {/* Notifications */}

        <button
          className="
          relative
          text-slate-300
          hover:text-white
          transition
          "
        >
          <Bell size={22} />

          <span
            className="
            absolute
            -top-1
            -right-1
            w-2.5
            h-2.5
            bg-cyan-400
            rounded-full
            "
          />
        </button>

        {/* User Info */}

        <div
          className="
          flex
          items-center
          gap-3
          "
        >
          <div
            className="
            w-11
            h-11
            rounded-full
            bg-gradient-to-br
            from-purple-500
            to-cyan-400
            flex
            items-center
            justify-center
            font-bold
            text-white
            uppercase
            "
          >
            {initials}
          </div>

          <div className="hidden md:block">
            <p className="font-semibold text-white">
              {user.fullName}
            </p>

            <div className="flex items-center gap-2">
              <span
                className={`
                text-[10px]
                px-2
                py-1
                rounded-full
                border
                font-medium
                ${roleColor()}
                `}
              >
                {user.role}
              </span>

              <span className="text-xs text-slate-500">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}

        <button
          onClick={onLogout}
          className="
          flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-700
          px-3
          py-2
          text-slate-300
          hover:bg-slate-800
          hover:text-white
          transition
          "
        >
          <LogOut size={18} />

          <span className="hidden lg:block">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}