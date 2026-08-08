import { Link } from "react-router-dom";
import { Search, ShieldCheck, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <GraduationCap className="h-5 w-5 text-foreground shrink-0" />
            <span className="font-semibold text-foreground text-sm sm:text-base truncate">
              IAUE-ITE-PG · Research Project Validator
            </span>
          </div>
          <Link to="/admin/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Admin
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-4 fade-in-up">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Search className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-foreground">
              Research Project Validator
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
              Ignatius Ajuru University of Education · ITE Postgraduate Department. Verify whether a
              proposed research project title has already been submitted.
            </p>
          </div>

          <div className="fade-in-up fade-in-up-delay-1">
            <Link to="/check">
              <Button size="lg" className="px-8 h-12 text-base active:scale-[0.97] transition-transform">
                Check Project Title
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 fade-in-up fade-in-up-delay-2">
            <FeatureCard icon={<Search className="h-4 w-4" />} title="Exact & Similar" desc="Detects duplicates and near matches" />
            <FeatureCard icon={<ShieldCheck className="h-4 w-4" />} title="Admin-Curated" desc="Only admins can upload records" />
            <FeatureCard icon={<BookOpen className="h-4 w-4" />} title="Postgraduate" desc="MSc · PGD · PhD projects" />
          </div>
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs sm:text-sm text-muted-foreground">
        IAUE — ITE Department · Postgraduate Project Registry
      </footer>
    </div>
  );
};

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-left space-y-1">
      <div className="flex items-center gap-2 text-foreground font-medium text-sm">
        {icon}
        {title}
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

export default LandingPage;
