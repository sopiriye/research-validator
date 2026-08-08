import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  BarChart3,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchReportSummary,
  type ReportSummary,
  type AdminAccount,
} from "@/lib/api";

const AdminDashboard = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const currentAccount = useMemo<AdminAccount | null>(() => {
    try {
      const raw = sessionStorage.getItem("iaue_admin_account");
      return raw ? (JSON.parse(raw) as AdminAccount) : null;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => {
    fetchReportSummary().then(setSummary);
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Welcome, {currentAccount?.fullName ?? "Admin"}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>Overview of the IAUE-ITE-PG project database.</span>
          {currentAccount && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-foreground bg-muted/40">
              <ShieldCheck className="h-3 w-3" />
              {currentAccount.role === "super_admin" ? "Super Admin" : "Admin"}
            </span>
          )}
        </p>
      </div>

      {!summary ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin-slow" /> Loading summary...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Projects" value={summary.totalProjects} />
          {summary.projectsByProgramme.map((p) => (
            <StatCard key={p.programme} label={`${p.programme} Projects`} value={p.total} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard
          to="/admin/dashboard/projects"
          icon={<FolderKanban className="h-4 w-4" />}
          title="Project Information"
          desc="Add new project records and search existing ones."
        />
        <ActionCard
          to="/admin/dashboard/reports"
          icon={<BarChart3 className="h-4 w-4" />}
          title="Project Reports"
          desc="View totals by year, programme, and combined breakdowns."
        />
      </div>

      {currentAccount?.role === "super_admin" && (
        <div className="pt-4 border-t">
          <Link
            to="/admin/dashboard/management"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShieldCheck className="h-3 w-3" />
            Admin management
          </Link>
        </div>
      )}
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function ActionCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="block group">
      <div className="rounded-lg border bg-card p-5 hover:border-foreground/20 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium text-sm text-foreground">
            {icon}
            {title}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
      </div>
    </Link>
  );
}

export default AdminDashboard;