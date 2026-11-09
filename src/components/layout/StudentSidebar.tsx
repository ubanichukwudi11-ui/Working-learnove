"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import {
  LayoutDashboard,
  BookOpen,
  NotebookPen,
  Bot,
  Video,
  BarChart3,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const links = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    name: "Subjects",
    href: "/subjects",
    icon: BookOpen,
  },

  {
    name: "Notebook",
    href: "/notebook",
    icon: NotebookPen,
  },

  {
    name: "Live Classes",
    href: "/live-classes",
    icon: Video,
  },

  {
    name: "Nova AI",
    href: "/nova",
    icon: Bot,
  },

  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },

  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function StudentSidebar() {
  const pathname = usePathname();

  const router = useRouter();

  const { logout } = useAuth();


  const handleLogout = () => {
    logout();

    router.push("/login");
  };


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

      {/* Logo */}
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
            from-purple-600
            to-cyan-400
            flex
            items-center
            justify-center
            font-bold
            text-white
          "
        >
          L
        </div>
      </div>


      {/* Navigation */}
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
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <Icon size={22} />
            </Link>
          );
        })}

      </nav>


      {/* Bottom */}
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
          title="Settings"
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
          onClick={handleLogout}
          title="Logout"
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