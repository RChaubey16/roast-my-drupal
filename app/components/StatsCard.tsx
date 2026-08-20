import { memo } from "react";
import type { RoastStats } from "@/lib/roast/roast-stats";
import { formatCreditDate } from "@/lib/format-date";

export const StatsCard = memo(function StatsCard({ stats }: { stats: RoastStats }) {
  return (
    <div className="w-full rounded-md border border-white/10 bg-surface p-5 text-left">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-flame-orange">
        The receipts
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <div>
          <dt className="font-mono text-xs uppercase tracking-wide text-muted">
            Account age
          </dt>
          <dd className="mt-1 font-mono text-sm text-foreground">
            {stats.accountAgeText ?? "unknown"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wide text-muted">
            Membership badge
          </dt>
          <dd className="mt-1 font-mono text-sm text-foreground">
            {stats.membershipBadge ?? "none"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wide text-muted">
            Contribution credits
          </dt>
          <dd className="mt-1 font-mono text-sm text-foreground">
            {stats.totalCredits}{" "}
            <span className="text-muted">({stats.securityAdvisoryCredits} security)</span>
          </dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wide text-muted">
            Most recent credit
          </dt>
          <dd className="mt-1 font-mono text-sm text-foreground">
            {stats.mostRecentCreditDate
              ? formatCreditDate(stats.mostRecentCreditDate)
              : "never"}
          </dd>
        </div>
      </dl>
    </div>
  );
});
