'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FileText, Globe, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  /** The request failed and there's nothing to show; avoids a misleading "no activity" message. */
  unavailable?: boolean;
}

// Editor-facing wording for the internal item types.
const TYPE_LABEL: Record<ActivityItem['type'], string> = {
  GENERATION: 'Generated',
  CRAWL: 'Crawled',
};

export default function ActivityFeed({ activities, loading, unavailable }: ActivityFeedProps) {
  const reduceMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading recent activity">
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

  if (unavailable) {
    return (
      <p className="py-12 text-center text-sm font-semibold text-gray-700">
        Recent activity isn&apos;t available right now.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      <AnimatePresence mode="popLayout">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <motion.li
              key={activity.id || index}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100"
            >
              <div
                aria-hidden
                className={`p-2.5 rounded-xl ${
                  activity.type === 'GENERATION' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                }`}
              >
                {activity.type === 'GENERATION' ? <FileText className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{activity.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                      activity.type === 'GENERATION' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'
                    }`}
                  >
                    {TYPE_LABEL[activity.type]}
                  </span>
                  <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden />
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </motion.li>
          ))
        ) : (
          <li className="py-16 text-center space-y-1 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 list-none">
            <h3 className="font-bold text-gray-900">No recent activity</h3>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Generated and crawled articles will be listed here as they arrive.
            </p>
          </li>
        )}
      </AnimatePresence>
    </ul>
  );
}
