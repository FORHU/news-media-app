"use client";

import React from "react";
import { Key, Zap, ZapOff, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type ApiKey = {
  id: string;
  sourceName: string;
  isActive: boolean;
  autoPublish: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [notification, setNotification] = React.useState<{ message: string; type: "success" | "error" } | null>(null);

  React.useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const { data: keys, isLoading, isError } = useQuery<ApiKey[]>({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const res = await fetch("/api/admin/apiKeys");
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, autoPublish }: { id: string; autoPublish: boolean }) => {
      const res = await fetch("/api/admin/apiKeys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, autoPublish }),
      });
      if (!res.ok) throw new Error("Failed to update API key");
      return res.json();
    },
    onSuccess: (updated: ApiKey) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      setNotification({
        message: `"${updated.sourceName}" auto-publish ${updated.autoPublish ? "enabled" : "disabled"}.`,
        type: "success",
      });
    },
    onError: () => {
      setNotification({ message: "Failed to update key. Try again.", type: "error" });
    },
  });

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Key className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        </div>
        <p className="text-sm text-gray-500 ml-9">
          Manage external API keys and auto-publish settings per partner.
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {notification.message}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500 text-sm">Failed to load API keys.</div>
      ) : !keys?.length ? (
        <div className="text-center py-16 text-gray-400 text-sm">No API keys found.</div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Auto-Publish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900">{k.sourceName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        k.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${k.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                      {k.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(k.createdAt), "MMM d, yyyy")}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {k.expiresAt ? format(new Date(k.expiresAt), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => toggleMutation.mutate({ id: k.id, autoPublish: !k.autoPublish })}
                        disabled={toggleMutation.isPending}
                        title={k.autoPublish ? "Click to disable auto-publish" : "Click to enable auto-publish"}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
                          k.autoPublish ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            k.autoPublish ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="ml-2.5 flex items-center gap-1 text-xs text-gray-500 w-16">
                        {k.autoPublish ? (
                          <><Zap className="w-3 h-3 text-blue-500" /> On</>
                        ) : (
                          <><ZapOff className="w-3 h-3" /> Off</>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        <strong>Auto-Publish ON</strong> — articles submitted via this key are published immediately and the URL is returned in the API response. <strong>Off</strong> — articles go through the normal pending → approval flow.
      </p>
    </div>
  );
}
