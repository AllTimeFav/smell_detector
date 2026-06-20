import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Layers, FileText, History, Settings, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Analysis', path: '/analysis', icon: Activity },
  { name: 'Anti-Patterns', path: '/patterns', icon: Layers },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'History', path: '/history', icon: History },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-colors">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <ShieldAlert className="w-6 h-6 text-indigo-500 mr-3" />
        <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">Code Smell Detector</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 px-2">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group",
              isActive 
                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}
