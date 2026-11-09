import React from 'react';

export function StatusBadge({ status }) {
  const configs = {
    published: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Published',
    },
    draft: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Draft',
    },
    publishing: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
      dot: 'bg-blue-500',
      label: 'Publishing...',
    },
    archived: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Archived',
    },
  };

  const current = configs[status] || configs.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
}
