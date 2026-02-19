import Link from "next/link";
import {
  BarChart3,
  PiggyBank,
  Upload,
  BrainCircuit,
  ArrowRight,
  Shield,
  Zap,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: BarChart3,
    title: "Visual Analytics",
    description: "Beautiful charts showing spending trends, category breakdowns, and income vs expenses over time.",
  },
  {
    icon: Upload,
    title: "CSV Import",
    description: "Import bank statements with smart column mapping and automatic transaction categorization.",
  },
  {
    icon: PiggyBank,
    title: "Budget Tracking",
    description: "Set monthly spending limits per category with real-time progress bars and over-budget alerts.",
  },
  {
    icon: Target,
    title: "Savings Goals",
    description: "Create goals, track progress with deposits, and hit your targets with deadline tracking.",
  },
  {
    icon: BrainCircuit,
    title: "Smart Insights",
    description: "AI-powered spending analysis, recurring expense detection, and monthly forecasting.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data stays yours. Encrypted authentication and secure database storage.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              F
            </div>
            <span className="text-xl font-bold">FinTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Zap className="h-4 w-4 text-amber-500" />
              Smart budget management for everyone
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Take Control of Your{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Finances
              </span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              Track expenses, set budgets, import bank statements, and get smart insights
              about your spending habits. All in one beautiful dashboard.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/register">
                  Start for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="/api/demo">
                  Try Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Everything you need to manage your money
              </h2>
              <p className="text-muted-foreground text-lg">
                From simple expense tracking to advanced forecasting — FinTrack has you covered.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to take control?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join FinTrack today and start making smarter financial decisions.
            </p>
            <Button size="lg" asChild className="text-base px-8">
              <Link href="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>FinTrack — Built with Next.js, TypeScript, and Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
