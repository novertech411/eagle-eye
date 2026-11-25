import Link from "next/link";
import { Plus } from "lucide-react";
import { ScansTable } from "@/components/dashboard/scans-table";
import {
  getDashboardStats,
  getScanFilterCounts,
  getScansPage,
  parseScanFilter,
} from "@/lib/supabase/queries";

export const metadata = { title: "Dashboard — Eagle Lense" };

type SearchParams = Record<string, string | string[] | undefined>;

const clinicDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = single(params.q).trim();
  const requestedPage = Number.parseInt(single(params.page), 10);
  const newestFirst = single(params.sort) !== "oldest";
  const status = parseScanFilter(single(params.status));

  const [counts, tabs, scans] = await Promise.all([
    getDashboardStats(),
    getScanFilterCounts(),
    getScansPage(
      query,
      requestedPage > 0 ? requestedPage : 1,
      newestFirst,
      status,
    ),
  ]);

  const referralRate = counts.total
    ? Math.round((100 * counts.referrals) / counts.total)
    : 0;
  const stats = [
    { label: "Total scans", value: counts.total, note: "All time" },
    {
      label: "Awaiting review",
      value: counts.awaiting,
      note: counts.awaiting ? "In the queue" : "Queue is clear",
    },
    {
      label: "Completed today",
      value: counts.completedToday,
      note: "Since 00:00",
    },
    {
      label: "Referrals made",
      value: counts.referrals,
      note: `${referralRate}% of scans`,
    },
  ];

  return (
    <div className="clinic-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-heading">
          {/* <p className="dashboard-date">
            {clinicDate.format(new Date()).replace(", ", " · ")}
          </p> */}
          <h1>Retinal screening overview</h1>
          {/* <p className="dashboard-description">Every scan across your clinic, analysed by Eagle Lense AI.</p> */}
        </div>
        <Link href="/examination" className="dashboard-primary">
          <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
          New scan
        </Link>
      </header>

      <dl className="dashboard-card dashboard-kpis">
        {stats.map(({ label, value, note }) => (
          <div key={label} className="dashboard-kpi">
            <dt>{label}</dt>
            <dd>{value}</dd>
            <dd>{note}</dd>
          </div>
        ))}
      </dl>

      {counts.total === 0 ? (
        <section
          id="dashboard-empty"
          tabIndex={-1}
          className="dashboard-card dashboard-empty"
        >
          <p>No scans yet. Start your first examination.</p>
          <Link href="/examination" className="dashboard-primary">
            Start examination
          </Link>
        </section>
      ) : (
        <ScansTable
          {...scans}
          query={query}
          newestFirst={newestFirst}
          status={status}
          counts={tabs}
        />
      )}
    </div>
  );
}
