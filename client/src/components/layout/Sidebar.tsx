import { Link, useLocation } from "wouter";
import { CalendarClock, FileText, Home, MessageSquare, Users, FileTextIcon, FileSignature, HardHat, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { path: "/dashboard", icon: <Home className="w-5 h-5 mr-3" />, label: "Dashboard" },
    { path: "/contacts", icon: <Users className="w-5 h-5 mr-3" />, label: "Contacts" },
    { path: "/quotes", icon: <FileText className="w-5 h-5 mr-3" />, label: "Quotes" },
    { path: "/invoices", icon: <FileTextIcon className="w-5 h-5 mr-3" />, label: "Invoices" },
    { path: "/contracts", icon: <FileSignature className="w-5 h-5 mr-3" />, label: "Contracts" },
    { path: "/jobs", icon: <HardHat className="w-5 h-5 mr-3" />, label: "Jobs" },
    { path: "/schedule", icon: <CalendarClock className="w-5 h-5 mr-3" />, label: "Schedule" },
    { path: "/messaging", icon: <MessageSquare className="w-5 h-5 mr-3" />, label: "Messaging" },
    { path: "/portal", icon: <Globe className="w-5 h-5 mr-3" />, label: "Customer Portal" },
  ];

  return (
    <aside className="hidden sm:flex flex-col w-64 bg-white border-r border-slate-200 h-screen">
      <div className="p-4 mb-8 flex items-center px-2">
        <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center text-white font-bold">P</div>
        <span className="ml-2 text-xl font-semibold text-slate-800">Pereira Portal</span>
      </div>
      
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive(item.path)
                  ? "bg-slate-100 text-primary"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              {isActive(item.path) ? (
                <span className="text-primary">{item.icon}</span>
              ) : (
                <span className="text-slate-400">{item.icon}</span>
              )}
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      
      <div className="mt-auto p-4">
        <Separator className="my-4" />
        <div className="flex items-center p-4 bg-slate-50 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
            M
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-slate-700">Mike Pereira</p>
            <p className="text-xs text-slate-500 truncate">mike@pereiraconstruction.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
