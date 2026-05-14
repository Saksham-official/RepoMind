"use client";

import { useEffect, useState } from "react";
import { Link as LinkIcon, GitCommit, AlertCircle, GitPullRequest } from "lucide-react";
import Link from "next/link";

interface Relationship {
  target_type: string;
  target_id: string;
  relationship: string;
}

export default function RelationshipLinks({ repoId, entityId, entityType }: { repoId: string, entityId: string, entityType: string }) {
  const [links, setLinks] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLinks() {
      try {
        const response = await fetch(`/api/analytics/relationships?repo_id=${repoId}&entity_id=${entityId}&entity_type=${entityType}`);
        const data = await response.json();
        setLinks(data);
      } catch (err) {
        console.error("Failed to fetch relationships:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLinks();
  }, [repoId, entityId, entityType]);

  if (isLoading || links.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon size={14} className="text-white/30" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Knowledge Graph Links</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((link, i) => {
          const Icon = link.target_type === "commit" ? GitCommit : link.target_type === "pr" ? GitPullRequest : AlertCircle;
          return (
            <div 
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
            >
              <Icon size={12} className="text-indigo-400" />
              <span className="text-[10px] font-mono text-white/50 uppercase">{link.relationship}</span>
              <span className="text-xs font-bold text-white/80">#{link.target_id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
