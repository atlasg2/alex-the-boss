import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const [location] = useLocation();

  const getPageTitle = () => {
    const path = location.split("/")[1];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/contacts", label: "Contacts" },
    { path: "/quotes", label: "Quotes" },
    { path: "/invoices", label: "Invoices" },
    { path: "/contracts", label: "Contracts" },
    { path: "/jobs", label: "Jobs" },
    { path: "/schedule", label: "Schedule" },
    { path: "/messaging", label: "Messaging" },
    { path: "/portal", label: "Customer Portal" },
  ];

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center bg-white border-b border-slate-200 px-4">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 sm:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:hidden p-0">
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-center mb-8 px-2">
                  <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center text-white font-bold">P</div>
                  <span className="ml-2 text-xl font-semibold text-slate-800">Pereira Portal</span>
                </div>
                <nav className="flex-1">
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <SheetClose key={item.path} asChild>
                        <Link
                          href={item.path}
                          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                            location === item.path
                              ? "bg-slate-100 text-primary"
                              : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </nav>
                <div className="mt-auto">
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
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="ml-2 text-xl font-semibold text-slate-800 sm:ml-0">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-sm font-medium text-slate-700 hover:text-slate-800">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                  M
                </div>
                <span className="hidden md:inline">Mike Pereira</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
