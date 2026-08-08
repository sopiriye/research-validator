import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchReportSummary, type ReportSummary, type Programme } from "@/lib/api";

const PROGRAMMES: Programme[] = ["MSc", "PGD", "PhD"];

const ProjectReports = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  useEffect(() => {
    fetchReportSummary().then(setSummary);
  }, []);

  if (!summary) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin-slow" /> Loading reports...
      </div>
    );
  }

  const years = summary.projectsByYear.map((y) => y.year);
  const matrix = new Map<string, number>();
  summary.projectsByProgrammeAndYear.forEach((r) => matrix.set(`${r.year}|${r.programme}`, r.total));
  const cell = (y: number, p: Programme) => matrix.get(`${y}|${p}`) ?? 0;
  const rowTotal = (y: number) => PROGRAMMES.reduce((s, p) => s + cell(y, p), 0);
  const maxYearTotal = Math.max(...summary.projectsByYear.map((y) => y.total), 1);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Project Reports</h1>
        <p className="text-sm text-muted-foreground">Overview of project records in the database.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Projects" value={summary.totalProjects} highlight />
        {summary.projectsByProgramme.map((p) => (
          <StatCard key={p.programme} label={`${p.programme} Projects`} value={p.total} />
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Projects Per Year</h2>
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Year</TableHead>
                  <TableHead>Distribution</TableHead>
                  <TableHead className="w-24 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.projectsByYear.map((y) => (
                  <TableRow key={y.year}>
                    <TableCell className="text-sm tabular-nums font-medium">{y.year}</TableCell>
                    <TableCell>
                      <div className="h-2 rounded-full bg-muted overflow-hidden max-w-md">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(y.total / maxYearTotal) * 100}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{y.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Projects Per Programme Per Year</h2>
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Year</TableHead>
                  {PROGRAMMES.map((p) => (
                    <TableHead key={p} className="text-right">{p}</TableHead>
                  ))}
                  <TableHead className="text-right w-24">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((y) => (
                  <TableRow key={y}>
                    <TableCell className="text-sm tabular-nums font-medium">{y}</TableCell>
                    {PROGRAMMES.map((p) => (
                      <TableCell key={p} className="text-right tabular-nums text-sm">
                        {cell(y, p)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {rowTotal(y)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40">
                  <TableCell className="text-sm font-semibold">All</TableCell>
                  {PROGRAMMES.map((p) => (
                    <TableCell key={p} className="text-right tabular-nums text-sm font-semibold">
                      {summary.projectsByProgramme.find((x) => x.programme === p)?.total ?? 0}
                    </TableCell>
                  ))}
                  <TableCell className="text-right tabular-nums text-sm font-semibold">
                    {summary.totalProjects}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
};

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>
      <p className={`text-xs ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</p>
      <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
    </div>
  );
}

export default ProjectReports;