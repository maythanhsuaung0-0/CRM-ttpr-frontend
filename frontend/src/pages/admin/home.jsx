import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  GraduationCap,
  LayoutGrid,
  Layers,
  LogOut,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/dataContext";

// Summary labels mirror the reference design; they are not live API totals.
const workspaceTools = [
  {
    name: "Dashboard",
    icon: LayoutGrid,
    path: "/admin/dashboard",
    category: "Overview",
    description: "View performance and activity across the CRM.",
    summary: "4 live reports",
    color: "bg-[#eff6ff] text-[#155dfb]",
  },
  {
    name: "Students",
    icon: GraduationCap,
    path: "/admin/view-students",
    category: "People",
    description: "Manage student profiles, majors, and progress.",
    summary: "1,247 profiles",
    color: "bg-[#ecfdff] text-[#0084a5]",
  },
  {
    name: "Companies",
    icon: Building2,
    path: "/admin/view-companies",
    category: "Opportunities",
    description: "Maintain employer contacts and partnerships.",
    summary: "86 partners",
    color: "bg-[#f5f2ff] text-[#8b46ff]",
  },
  {
    name: "Internships",
    icon: BriefcaseBusiness,
    path: "/admin/view-internships",
    category: "Opportunities",
    description: "Publish roles and review student applications.",
    summary: "10 active",
    color: "bg-[#fff7ed] text-[#ff570a]",
  },
  {
    name: "Calendar",
    icon: CalendarDays,
    path: "/coming-soon",
    category: "Planning",
    description: "See interviews, events, and key deadlines.",
    summary: "4 this week",
    color: "bg-[#eff6ff] text-[#155dfb]",
  },
  {
    name: "Appointments",
    icon: Clock3,
    path: "/admin/view-appointments",
    category: "Planning",
    description: "Coordinate advising sessions and meetings.",
    summary: "2 today",
    color: "bg-[#effcf9] text-[#009b91]",
  },
  {
    name: "Documents",
    icon: FileText,
    path: "/coming-soon",
    category: "Resources",
    description: "Access forms, templates, and shared resources.",
    summary: "32 files",
    color: "bg-[#f0f9ff] text-[#008aca]",
  },
  {
    name: "Techstacks",
    icon: Layers,
    path: "/coming-soon",
    category: "Resources",
    description: "Maintain the technology skills directory.",
    summary: "18 categories",
    color: "bg-[#eef2ff] text-[#7454ff]",
  },
  {
    name: "Skills",
    icon: Check,
    path: "/coming-soon",
    category: "Resources",
    description: "Track competencies across student profiles.",
    summary: "64 skills",
    color: "bg-[#ecfdf5] text-[#009879]",
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/admin/profile",
    category: "Administration",
    description: "Configure access, roles, and CRM preferences.",
    summary: "Admin access",
    color: "bg-[#f1f5f9] text-[#52647d]",
  },
];

export default function AdminHome() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const userName = currentUser?.name || "Admin";
  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();
  const query = searchQuery.trim().toLowerCase();
  const filteredTools = workspaceTools.filter((tool) =>
    `${tool.name} ${tool.category} ${tool.description}`
      .toLowerCase()
      .includes(query),
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] text-[#172037] antialiased">
      <header className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#dce5f1] bg-white px-14 py-2 sm:h-16 sm:flex-nowrap sm:py-0">
        <Link
          to="/admin"
          className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#155dfb] sm:w-[21.5%]"
        >
          <BrandLogo />
        </Link>

        <label className="order-3 flex h-11 w-full items-center gap-3 rounded-full bg-[#f1f5f9] px-4 text-[#8ca2bf] focus-within:ring-2 focus-within:ring-[#155dfb]/30 sm:order-none sm:max-w-96">
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">Search workspace tools</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search your workspace..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#172037] outline-none placeholder:text-[#828b9c]"
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <Link
            to="/admin/view-staff-requests"
            aria-label="View staff requests"
            title="Staff requests"
            className="relative rounded-lg p-2 text-[#52647d] transition-colors hover:bg-[#f1f5f9] focus-visible:outline-2 focus-visible:outline-[#155dfb]"
          >
            <Bell size={20} strokeWidth={1.7} aria-hidden="true" />
            <span
              className="absolute right-1.5 top-1.5 size-2.5 rounded-full border border-white bg-[#ff7900]"
              aria-hidden="true"
            />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Open account menu for ${userName}`}
                className="flex cursor-pointer items-center gap-3 border-l border-[#dce5f1] pl-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#155dfb]/30"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt={`${userName}'s avatar`}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block">
                  <span className="block max-w-48 truncate text-sm font-semibold">
                    {userName}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#637a9c]">
                    {currentUser?.role || "admin"}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/profile">
                  <UserRound aria-hidden="true" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut aria-hidden="true" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto my-auto w-full max-w-[1264px] px-5 sm:px-8">
        <section
          aria-labelledby="welcome-title"
          className="relative isolate min-h-[140px] overflow-hidden rounded-2xl bg-[#007595] px-6 py-6 text-white sm:px-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 -z-10 size-56 rounded-full border-[34px] border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-20 h-2 w-28 bg-[#ff9500]"
          />
          <p className="text-xs font-bold tracking-[0.18em] text-[#d0f0f5]">
            CITY TECH CAREER SERVICES
          </p>
          <h1
            id="welcome-title"
            className="mt-3 text-2xl font-bold leading-8 tracking-[-0.025em]"
          >
            What would you like to manage today?
          </h1>
          <p className="mt-2.5 text-sm leading-5 text-[#cae8f0]">
            Access every part of your CRM from one organized workspace.
          </p>
        </section>

        <section aria-labelledby="tools-title" className="mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2
                id="tools-title"
                className="text-lg font-semibold tracking-[-0.01em]"
              >
                All workspace tools
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-[#637a9c]">
                Everything you need to run your career services program.
              </p>
            </div>
            <p
              className="shrink-0 pb-0.5 text-xs font-medium text-[#8aa0bf]"
              aria-live="polite"
            >
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "application" : "applications"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {filteredTools.map(({ icon: Icon, ...tool }) => (
              <Link
                to={tool.path}
                key={tool.name}
                className="group flex min-h-[170px] flex-col rounded-xl border border-[#dce5f1] bg-white p-4 shadow-[0_1px_2px_rgb(23_32_55_/_0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b3ceff] hover:shadow-[0_4px_12px_rgb(23_32_55_/_0.05)] focus-visible:border-[#155dfb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155dfb]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tool.color}`}
                  >
                    <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[#f7f9fc] px-2 py-1 text-[9px] font-semibold uppercase leading-3 tracking-[0.04em] text-[#8aa0bf]">
                    {tool.category}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-5">
                  {tool.name}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#637a9c]">
                  {tool.description}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs leading-4 text-[#8aa0bf]">
                  <span>{tool.summary}</span>
                  <ArrowRight
                    size={15}
                    strokeWidth={1.5}
                    className="text-[#c0d0e5] transition-colors group-hover:text-[#155dfb]"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#dce5f1] bg-white px-6 py-12 text-center">
              <h3 className="text-sm font-semibold">No tools found</h3>
              <p className="mt-2 text-sm text-[#637a9c]">
                Try another name or search for a category like planning.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-4 cursor-pointer rounded text-sm font-medium text-[#155dfb] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#155dfb]"
              >
                Clear search
              </button>
            </div>
          )}
        </section>

        <aside
          aria-labelledby="continue-title"
          className="mt-5 flex flex-col gap-4 rounded-xl border border-[#dce5f1] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#fff7ed] text-[#ff570a]">
              <Clock3 size={19} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div>
              <h2 id="continue-title" className="text-sm font-semibold">
                Continue where you left off
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#637a9c]">
                Internship applications · Review and manage opportunities
              </p>
            </div>
          </div>
          <Link
            to="/admin/view-internships"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-3 rounded-lg bg-[#155dfb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#104bd0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155dfb]"
          >
            Open internships <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </aside>
      </main>
    </div>
  );
}
