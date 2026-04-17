'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, 
    Globe,
    CheckCircle 
} from 'lucide-react';
import Sparkline from './Sparkline';
import SystemStatusLiveClock from './SystemStatusLiveClock';

interface MetricProps {
  label: string;
  value: number;
  total?: number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

const MetricRow = ({ label, value, total = 100, icon, color, delay = 0 }: MetricProps) => {
  const percentage = Math.min(Math.round((value / total) * 100) || 0, 100);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-gray-50 text-gray-500`}>
            {React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
          </div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-gray-900">{value}</span>
            <span className="text-[10px] font-bold text-gray-400">/ {total}</span>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

export default function QueueStatusCard({ data }: { data: any }) {
  // Use real data from the API or defaults
  const queue = data?.queueStatus || { pendingAI: 0, activeCrawls: 0, totalToday: 0 };
  
  // Mock data for system trends
  const loadTrend = [12, 15, 13, 18, 22, 20, 25, 23, 19, 24, 28, 22];

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Queue Status</h2>
          <p className="text-gray-400 text-xs font-medium mt-1">AI & Crawler pipeline</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
          queue.activeCrawls > 0 
            ? 'bg-blue-50 text-blue-600 border-blue-100' 
            : 'bg-green-50 text-green-600 border-green-100'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${queue.activeCrawls > 0 ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {queue.activeCrawls > 0 ? 'Processing' : 'Idle'}
          </span>
        </div>
      </div>

      <div className="space-y-8">
        <MetricRow 
          label="AI Generation Queue" 
          value={queue.pendingAI} 
          total={50}
          icon={<Zap />} 
          color="bg-[#ff4500]" 
          delay={0.1}
        />
        <MetricRow 
          label="Active Crawl Jobs" 
          value={queue.activeCrawls} 
          total={10}
          icon={<Globe />} 
          color="bg-blue-600" 
          delay={0.2}
        />
        <MetricRow 
          label="Total Items Today" 
          value={queue.totalToday} 
          total={queue.totalToday + 20}
          icon={<CheckCircle />} 
          color="bg-green-600" 
          delay={0.3}
        />
      </div>

      <div className="mt-10 mb-8 pt-8 border-t border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Processing Load Trend</span>
          <span className="text-xs font-bold text-gray-900">High Efficiency</span>
        </div>
        <Sparkline data={loadTrend} width={280} height={50} color="#ff4500" />
      </div>

      <div className="mt-auto pt-6">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-orange-50/30 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Update</p>
              <SystemStatusLiveClock />
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                <motion.div 
                    animate={{ scale: queue.activeCrawls > 0 ? [1, 1.4, 1] : [1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className={`w-2 h-2 rounded-full ${queue.activeCrawls > 0 ? 'bg-blue-500' : 'bg-green-500'}`}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
