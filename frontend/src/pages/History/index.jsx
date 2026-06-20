import React from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../../services/api';

export default function History() {
  const { data: history = [], isLoading, isError } = useQuery({
    queryKey: ['history'],
    queryFn: fetchHistory
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-7xl mx-auto flex flex-col h-full"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center">
          <HistoryIcon className="w-6 h-6 mr-3 text-indigo-500" />
          Scan History
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review past code analysis sessions and track improvements over time.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date & Time</th>
              <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Files Analyzed</th>
              <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Issues Found</th>
              <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Health Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-zinc-500">Loading history...</td>
              </tr>
            )}
            {!isLoading && history.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-zinc-500">No scan history available.</td>
              </tr>
            )}
            {history.slice().reverse().map((session) => (
              <tr key={session.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-zinc-400 mr-2" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{session.date}</span>
                    <span className="text-zinc-500 ml-2">{session.time}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-zinc-600 dark:text-zinc-300">{session.files}</td>
                <td className="py-4 px-6 text-zinc-600 dark:text-zinc-300">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400">
                    {session.issues} issues
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`font-bold ${session.score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {session.score} / 100
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
