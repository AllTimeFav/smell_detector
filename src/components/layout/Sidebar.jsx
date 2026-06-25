import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Layers, FileText, ShieldAlert, PanelLeftClose, PanelLeftOpen, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Analysis', path: '/analysis', icon: Activity },
  { name: 'Anti-Patterns', path: '/patterns', icon: Layers },
  { name: 'How It Works', path: '/how-it-works', icon: HelpCircle },
  { name: 'Reports', path: '/reports', icon: FileText },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "h-16 flex items-center border-b border-zinc-200 dark:border-zinc-800",
        isCollapsed ? "justify-center" : "px-4 justify-between"
      )}>
        <div className={cn("flex items-center", isCollapsed ? "hidden" : "flex")}>
          <ShieldAlert className="w-6 h-6 text-indigo-500 mr-2" />
          <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight whitespace-nowrap">Smell Detector</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 px-2">Menu</div>}
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) => cn(
              "flex items-center rounded-md text-sm font-medium transition-colors group",
              isCollapsed ? "justify-center p-3" : "px-3 py-2",
              isActive
                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <item.icon className={cn("shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3")} />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
