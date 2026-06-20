import React from 'react';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = {
  'Singleton Abuse': '#a855f7',
  'God Class': '#ef4444',
  'Blob Class': '#ef4444',
  'Refused Bequest': '#f97316',
  'Speculative Generality': '#eab308',
  'Inappropriate Intimacy': '#3b82f6',
  'Mutable Global State': '#ec4899',
  'Other': '#6b7280'
};

const SEV_COLORS = {
  'Critical': '#ef4444',
  'High': '#f97316',
  'Warning': '#eab308',
  'Medium': '#eab308',
  'Low': '#3b82f6'
};

export function AntiPatternCharts() {
  const { issues } = useAnalysisStore();

  const typeDataRaw = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.keys(typeDataRaw).map(key => ({
    name: key,
    value: typeDataRaw[key]
  }));

  const sevDataRaw = issues.reduce((acc, issue) => {
    const sev = issue.severity || 'Medium';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, { Critical: 0, High: 0, Warning: 0, Low: 0 });

  const sevData = Object.keys(sevDataRaw).map(key => ({
    name: key,
    value: sevDataRaw[key]
  })).filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-6">Distribution by Type</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Other']} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#f4f4f5' }}
                itemStyle={{ color: '#f4f4f5' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-6">Distribution by Severity</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sevData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
              <YAxis allowDecimals={false} stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
              <Tooltip 
                cursor={{fill: '#27272a', opacity: 0.4}}
                contentStyle={{ borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#f4f4f5' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {sevData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SEV_COLORS[entry.name] || SEV_COLORS['Medium']} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
