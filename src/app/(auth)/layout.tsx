import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground text-primary font-bold">
            F
          </div>
          <span className="text-2xl font-bold">FinTrack</span>
        </Link>
        <div>
          <blockquote className="text-lg font-medium leading-relaxed opacity-90">
            &ldquo;Take control of your finances with smart tracking, beautiful analytics,
            and AI-powered insights.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm opacity-70">
            Track expenses, set budgets, and achieve your savings goals.
          </p>
        </div>
        <p className="text-sm opacity-50">
          Built with Next.js, TypeScript & Tailwind CSS
        </p>
      </div>

      {/* Right side — form */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 lg:hidden"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            F
          </div>
          <span className="text-xl font-bold">FinTrack</span>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
