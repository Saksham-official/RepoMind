"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Award, Clock } from "lucide-react";
import { getContributorVelocity, ContributorStats } from "@/lib/api";

export default function AnalyticsTab({ repoId }: { repoId?: string }) {
  const [stats, setStats] = useState<ContributorStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getContributorVelocity(repoId);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [repoId]);

  if (isLoading) {
    return <div className="p-8 text-center text-white/40">Loading contributor insights...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          label="Active Contributors" 
          value={stats.length} 
          sub="last 30 days" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Total Velocity" 
          value={stats.reduce((a, b) => a + b.total_commits, 0)} 
          sub="commits indexed" 
        />
        <StatCard 
          icon={Award} 
          label="Top Contributor" 
          value={stats[0]?.username || "N/A"} 
          sub={`${stats[0]?.impact_score || 0} impact score`} 
        />
        <StatCard 
          icon={Clock} 
          label="Last Update" 
          value="Today" 
          sub={new Date().toLocaleDateString()} 
        />
      </div>

      <div className="glass overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Contributor Impact Leaderboard</h3>
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Velocity Metrics</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] text-white/30 uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-medium">Contributor</th>
                <th className="px-6 py-4 font-medium text-center">Commits</th>
                <th className="px-6 py-4 font-medium text-center">Features</th>
                <th className="px-6 py-4 font-medium text-center">Fixes</th>
                <th className="px-6 py-4 font-medium text-right">Impact Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.map((s, i) => (
                <motion.tr 
                  key={s.username}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {s.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/90">{s.username}</div>
                        <div className="text-[10px] text-white/40">Last active: {new Date(s.last_active).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-white/60">{s.total_commits}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                      {s.feat}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                      {s.fix}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-indigo-400">{s.impact_score}</div>
                    <div className="w-24 ml-auto h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${Math.min((s.impact_score / (stats[0]?.impact_score || 1)) * 100, 100)}%` }} 
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string | number, sub: string }) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon size={16} className="text-white/40" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white/90 mb-1">{value}</div>
      <div className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{label}</div>
      <div className="text-[10px] text-white/20 mt-2">{sub}</div>
    </div>
  );
}
