'use client';

import React from 'react';
import { Zap, Globe, CheckCircle } from 'lucide-react';
import type { dashboardService } from '@/services/admin/dashboard.service';

type DashboardStats = Awaited<ReturnType<typeof dashboardService.getStats>>;

interface CountRowProps {
  label: string;
  /** null = unavailable; shown as a dash. */
  value: number | null;
  unit: string;
  icon: React.ReactNode;
}

// Plain counts only. There is no capacity setting to compare against, so no
// progress bar: a bar needs a real maximum, and an invented one misleads.
const CountRow = ({ label, value, unit, icon }: CountRowProps) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
      <span className="p-1.5 rounded-lg bg-gray-100 text-gray-600" aria-hidden>
        {icon}
      </span>
      {label}
    </dt>
    <dd className="flex items-baseline gap-1.5 text-right">
      <span className="text-2xl font-black text-gray-900">{value === null ? '—' : value}</span>
      <span className="text-xs font-semibold text-gray-600">{unit}</span>
    </dd>
  </div>
);

export default function QueueStatusCard({
  data,
  unavailable = false,
}: {
  data?: DashboardStats;
  unavailable?: boolean;
}) {
  const queue = data?.queueStatus || { pendingAI: 0, activeCrawls: 0, totalToday: 0 };
  const val = (n: number) => (unavailable ? null : n);

  // "Working" if anything is queued or running, not only crawls.
  const working = queue.activeCrawls > 0 || queue.pendingAI > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Queue status</h2>
          <p className="text-gray-600 text-xs font-medium mt-1">AI &amp; crawler pipeline</p>
        </div>
        {!unavailable ? (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              working ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <span
              aria-hidden
              className={`w-1.5 h-1.5 rounded-full ${working ? 'bg-blue-600' : 'bg-gray-400'}`}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider">{working ? 'Working' : 'Idle'}</span>
          </div>
        ) : null}
      </div>

      <dl className="space-y-6">
        <CountRow label="Waiting for AI" value={val(queue.pendingAI)} unit="queued" icon={<Zap className="w-4 h-4" />} />
        <CountRow label="Crawl jobs" value={val(queue.activeCrawls)} unit="running" icon={<Globe className="w-4 h-4" />} />
        <CountRow
          label="Produced today"
          value={val(queue.totalToday)}
          unit="crawled + generated"
          icon={<CheckCircle className="w-4 h-4" />}
        />
      </dl>
    </div>
  );
}
