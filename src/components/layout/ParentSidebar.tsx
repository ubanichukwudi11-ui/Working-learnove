"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  Video,
  MessageSquare,
  User,
  Settings,
  LogOut,
  HeartHandshake,
} from "lucide-react";

const links = [
  {
    name: "Dashboard",
    href: "/parent",
    icon: LayoutDashboard,
  },

  {
    name: "My Children",
    href: "/parent/children",
    icon: Users,
  },

  {
    name: "Attendance",
    href: "/parent/attendance",
    icon: CalendarCheck,
  },

  {
    name: "Assignments",
    href: "/parent/assignments",
    icon: ClipboardList,
  },

  {
    name: "Results",
    href: "/parent/results",
    icon: BarChart3,
  },

  {
    name: "Live Classes",
    href: "/parent/live-classes",
    icon: Video,
  },

  {
    name: "Teacher Feedback",
    href: "/parent/feedback",
    icon: MessageSquare,
  },

  {
    name: "Profile",
    href: "/parent/profile",
    icon: User,
  },
];

export default function ParentSidebar() {
  const pathname = usePathname();

  const router = useRouter();

  const { logout } = useAuth();

  return (
    <aside
      className="
      fixed
      left-0
      top-0
      h-screen
      w-20
      z-50
      bg-[#111827]
      border-r
      border-slate-800
      flex
      flex-col
      "
    >
      <div
        className="
        h-20
        flex
        items-center
        justify-center
        border-b
        border-slate-800
        "
      >
        <div
          className="
          w-10
          h-10
          rounded-2xl
          bg-gradient-to-br
          from-pink-500
          to-orange-500
          flex
          items-center
          justify-center
          text-white
          "
        >
          <HeartHandshake size={18} />
        </div>
      </div>

      <nav
        className="
        flex-1
        py-6
        flex
        flex-col
        items-center
        gap-3
        "
      >
        {links.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(
              item.href + "/"
            );

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={`
                w-12
                h-12
                rounded-2xl
                flex
                items-center
                justify-center
                transition

                ${
                  active
                    ? "bg-pink-500 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <Icon size={22} />
            </Link>
          );
        })}
      </nav>

      <div
        className="
        border-t
        border-slate-800
        py-5
        flex
        flex-col
        items-center
        gap-3
        "
      >
        <button
          className="
          w-12
          h-12
          rounded-2xl
          text-slate-400
          hover:bg-slate-800
          flex
          items-center
          justify-center
          "
        >
          <Settings size={22} />
        </button>

        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="
          w-12
          h-12
          rounded-2xl
          text-slate-400
          hover:bg-red-500/10
          hover:text-red-400
          flex
          items-center
          justify-center
          "
        >
          <LogOut size={22} />
        </button>
      </div>
    </aside>
  );
}