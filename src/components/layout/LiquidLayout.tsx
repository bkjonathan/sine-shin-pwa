import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  HandCoins,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Settings,
  UserRoundSearch,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/customers", label: "Customers", icon: UserRoundSearch },
  { path: "/orders", label: "Orders", icon: PackageSearch },
  { path: "/expenses", label: "Expenses", icon: HandCoins },
  { path: "/settings", label: "Settings", icon: Settings },
];

const DESKTOP_SIDEBAR_STORAGE_KEY = "liquid_sidebar_collapsed";

const getInitialDesktopSidebarState = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY) === "1";
};

const NavMenu = ({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) => {
  return (
    <nav
      className={cn(
        "space-y-1",
        collapsed && "flex flex-col items-center gap-3 space-y-0 pt-1",
      )}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          onClick={onNavigate}
          className={({ isActive }) => {
            if (collapsed) {
              return cn(
                "mx-auto grid size-12 place-items-center rounded-full transition-all duration-200",
                isActive
                  ? "bg-slate-950/55 text-slate-100 shadow-[0_14px_30px_-22px_rgba(2,6,23,0.95)]"
                  : "text-slate-200/85 hover:bg-slate-950/40 hover:text-slate-50",
              );
            }

            return cn(
              buttonVariants({
                variant: isActive ? "secondary" : "ghost",
                size: "default",
              }),
              "w-full justify-start rounded-xl",
              isActive
                ? "border-white/70 bg-white/70 text-foreground shadow-[0_14px_30px_-26px_rgba(15,23,42,0.9)]"
                : "text-muted-foreground hover:text-foreground",
            );
          }}
          title={collapsed ? item.label : undefined}
        >
          <item.icon className="size-4" />
          <span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

const ShellBrand = ({ collapsed = false }: { collapsed?: boolean }) => {
  return (
    <div
      className={cn(
        "flex items-center px-1",
        collapsed ? "justify-center" : "gap-3",
      )}
    >
      <div className="grid size-10 place-items-center rounded-xl border border-white/65 bg-gradient-to-br from-sky-500/95 via-cyan-500/85 to-blue-600/90 text-white shadow-[0_14px_36px_-16px_rgba(14,116,144,0.85)]">
        <Layers className="size-5" />
      </div>
      {!collapsed && (
        <div>
          <p className="text-base font-semibold tracking-tight">Sine Shin</p>
          <p className="text-muted-foreground text-xs">Liquid Operations</p>
        </div>
      )}
    </div>
  );
};

export const LiquidLayout: React.FC = () => {
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(
    getInitialDesktopSidebarState,
  );

  useEffect(() => {
    window.localStorage.setItem(
      DESKTOP_SIDEBAR_STORAGE_KEY,
      desktopCollapsed ? "1" : "0",
    );
  }, [desktopCollapsed]);

  return (
    <div className="liquid-page h-screen">
      <div className="liquid-orb left-[-120px] top-[-80px] size-80 bg-sky-400/35" />
      <div className="liquid-orb liquid-orb-drift right-[-90px] top-[18%] size-64 bg-cyan-300/35" />
      <div className="liquid-orb bottom-[-130px] left-[32%] size-96 bg-blue-300/30" />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="border-none bg-transparent p-3 shadow-none"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Main application navigation</SheetDescription>
          </SheetHeader>

          <div className="glass-panel-strong flex h-full flex-col p-4">
            <ShellBrand />
            <Separator className="my-4 bg-white/60 dark:bg-white/20" />
            <NavMenu onNavigate={() => setMobileOpen(false)} />

            <div className="mt-auto space-y-4">
              <Separator className="bg-white/60 dark:bg-white/20" />
              <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-3 backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/65 dark:shadow-[0_18px_40px_-30px_rgba(2,6,23,0.95)]">
                <Avatar className="size-9 border border-white/60 bg-white/75 dark:border-white/25 dark:bg-slate-800/70">
                  <AvatarFallback className="dark:bg-slate-700/70 dark:text-slate-100">
                    {user?.email?.slice(0, 2).toUpperCase() ?? "SS"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium dark:text-slate-100">
                    {user?.email ?? "Signed in"}
                  </p>
                  <p className="text-muted-foreground text-xs dark:text-slate-300">
                    Authenticated
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-500/10 hover:text-red-600"
                onClick={() => void signOut()}
              >
                <LogOut className="size-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative z-10 flex h-full overflow-hidden">
        <aside
          className={cn(
            "hidden shrink-0 p-4 pr-0 transition-[width] duration-300 md:block",
            desktopCollapsed ? "w-28" : "w-80",
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={cn(
              "glass-panel-strong sticky top-4 flex h-[calc(100vh-2rem)] flex-col transition-all duration-300",
              desktopCollapsed ? "px-3 py-4" : "p-4",
            )}
          >
            <div
              className={cn(
                "flex gap-3",
                desktopCollapsed
                  ? "flex-col items-center"
                  : "items-center justify-between",
              )}
            >
              <ShellBrand collapsed={desktopCollapsed} />
              <Button
                variant={desktopCollapsed ? "ghost" : "outline"}
                size="icon-sm"
                className={cn(
                  "rounded-full",
                  desktopCollapsed &&
                    "size-11 border border-white/15 bg-slate-950/50 text-slate-100 hover:bg-slate-950/65",
                )}
                onClick={() => setDesktopCollapsed((prev) => !prev)}
              >
                {desktopCollapsed ? (
                  <ChevronsRight className="size-4" />
                ) : (
                  <ChevronsLeft className="size-4" />
                )}
                <span className="sr-only">
                  {desktopCollapsed ? "Expand navigation" : "Collapse navigation"}
                </span>
              </Button>
            </div>

            <Separator
              className={cn(
                "my-4 bg-white/60 dark:bg-white/20",
                desktopCollapsed && "mx-2",
              )}
            />
            <NavMenu collapsed={desktopCollapsed} />

            <div className="mt-auto space-y-4">
              <Separator
                className={cn(
                  "bg-white/60 dark:bg-white/20",
                  desktopCollapsed && "mx-1",
                )}
              />
              <div
                className={cn(
                  "rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/65 dark:shadow-[0_18px_40px_-30px_rgba(2,6,23,0.95)]",
                  desktopCollapsed
                    ? "mx-auto flex w-fit justify-center rounded-full p-2"
                    : "flex items-center gap-3 p-3",
                )}
              >
                <Avatar className="size-9 border border-white/60 bg-white/75 dark:border-white/25 dark:bg-slate-800/70">
                  <AvatarFallback className="dark:bg-slate-700/70 dark:text-slate-100">
                    {user?.email?.slice(0, 2).toUpperCase() ?? "SS"}
                  </AvatarFallback>
                </Avatar>
                {!desktopCollapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium dark:text-slate-100">
                      {user?.email ?? "Signed in"}
                    </p>
                    <p className="text-muted-foreground text-xs dark:text-slate-300">
                      Authenticated
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                className={cn(
                  "w-full text-red-600 hover:bg-red-500/10 hover:text-red-600",
                  desktopCollapsed
                    ? "mx-auto h-11 w-11 justify-center rounded-2xl p-0"
                    : "justify-start",
                )}
                onClick={() => void signOut()}
                title={desktopCollapsed ? "Sign Out" : undefined}
              >
                <LogOut className="size-4" />
                <span className={desktopCollapsed ? "sr-only" : undefined}>
                  Sign Out
                </span>
              </Button>
            </div>
          </motion.div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-6">
          <header className="glass-panel-strong sticky top-4 z-20 mx-4 mt-4 flex items-center justify-between px-4 py-3 md:mx-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Production Intelligence
                </p>
                <p className="text-muted-foreground text-xs">
                  Live workflow orchestration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="glass-pill border-white/70 bg-white/70 text-xs"
              >
                Live
              </Badge>
              <ThemeToggle className="rounded-full" />
              <Button variant="outline" size="icon-sm" className="rounded-full">
                <Bell className="size-4" />
                <span className="sr-only">Notifications</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 pt-6 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
