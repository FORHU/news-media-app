'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    Globe, 
    CheckCircle2, 
    Clock, 
    ArrowRight 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Sparkline from './Sparkline';

interface ActivityItem {
  id: string;
  type: 'GENERATION' | 'CRAWL';
  title: string;
  timestamp: string;
  status: string;
  category?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export default function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  // Mock trend data for the sparkline
  const activityTrend = [4, 7, 5, 9, 12, 8, 15, 11, 14, 18, 16, 22];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Activity Trend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
        <div>
          <span className="text-[10px] font-bold text-[#ff4500] uppercase tracking-widest">Activity Trend</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-gray-900">2.4k</span>
            <span className="text-xs font-bold text-green-600">+12% this hour</span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <Sparkline data={activityTrend} width={160} height={40} color="#ff4500" />
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center gap-4 p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:shadow-sm"
              >
                <div className={`p-2.5 rounded-xl ${
                  activity.type === 'GENERATION' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-green-50 text-green-600'
                }`}>
                  {activity.type === 'GENERATION' ? <FileText className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {activity.title}
                    </p>
                    {activity.status === 'completed' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 fill-green-50" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-md ${
                       activity.type === 'GENERATION' 
                       ? 'bg-blue-100/50 text-blue-700' 
                       : 'bg-green-100/50 text-green-700'
                    }`}>
                      {activity.type}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-900">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900">Waiting for Data</h3>
                <p className="text-sm text-gray-400 max-w-[200px]">Logs will appear here once the system starts crawling articles.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {activities.length > 5 && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
            <button className="text-xs font-bold text-gray-400 hover:text-[#ff4500] transition-colors flex items-center gap-2">
                See more activities
                <ArrowRight className="w-3 h-3" />
            </button>
        </div>
      )}
    </div>
  );
}
