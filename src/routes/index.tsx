import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PhoneOff, Moon, RotateCcw, CalendarCheck, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KOLVAX — Recover the revenue you're already losing" },
      { name: "description", content: "KOLVAX is a Revenue Recovery Platform for service businesses. We quietly recover missed calls, after-hours bookings, lapsed customers, no-shows, and reviews — so owners can focus on running the business." },
      { property: "og:title", content: "KOLVAX — Recover the revenue you're already losing" },
      { property: "og:description", content: "A trusted employee that recovers revenue in the background. Deployed in 48 hours." },
    ],
  }),
  component: Landing,
});

const ENGINES = [
  { icon: PhoneOff, name: "Missed Call Recovery", copy: "Every missed call is answered and booked — usually in under a minute." },
  { icon: Moon, name: "After-Hours Booking", copy: "Inquiries that arrive after closing are handled overnight, ready in the morning." },
  { icon: RotateCcw, name: "Customer Reactivation", copy: "Lapsed customers are gently invited back so earned revenue doesn't fade." },
  { icon: CalendarCheck, name: "No-Show Prevention", copy: "Appointments are confirmed twice — the chair never sits empty." },
  { icon: Star, name: "Review & Reputation Growth", copy: "Recent visitors are invited to share their experience while it's fresh." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 lg:px-10 py-6 flex items-center justify-between max-w-[1240px] mx-auto">
        <span className="editorial-h1 text-xl tracking-tight">KOLVAX</span>
        <nav className="flex items-center gap-2">
          <Link to="/auth" className="text-sm text-ink-soft hover:text-foreground px-3 py-2">Sign in</Link>
          <Link to="/auth" className="text-sm font-medium bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90">
            Get started
          </Link>
        </nav>
      </header>

      <section className="px-6 lg:px-10 pt-16 lg:pt-28 pb-20 max-w-[1240px] mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-money mb-6">Revenue Recovery Platform</p>
        <h1 className="editorial-h1 text-5xl lg:text-7xl text-foreground max-w-4xl">
          Recover the revenue you're already losing.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-soft">
          KOLVAX runs quietly in the background for service businesses — recovering missed calls,
          after-hours inquiries, lapsed customers, no-shows, and reviews. You focus on running
          the business. We handle the rest.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-5 py-3 text-sm font-medium hover:opacity-90">
            Open your dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-ink-faint">Deployed in 48 hours. No setup on your end.</span>
        </div>
      </section>

      <section className="px-6 lg:px-10 py-16 border-t border-border max-w-[1240px] mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-ink-faint mb-4">Five engines, one outcome</p>
        <h2 className="editorial-h1 text-3xl lg:text-4xl text-foreground max-w-2xl">
          Quietly recovering revenue across every touchpoint.
        </h2>
        <div className="mt-12 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3 border border-border rounded-lg overflow-hidden">
          {ENGINES.map((e) => (
            <div key={e.name} className="bg-surface p-8">
              <e.icon className="h-5 w-5 text-money" strokeWidth={1.75} />
              <h3 className="mt-4 text-base font-semibold text-foreground">{e.name}</h3>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed">{e.copy}</p>
            </div>
          ))}
          <div className="bg-money-soft p-8">
            <p className="money-text text-3xl text-money">$4,820</p>
            <p className="mt-2 text-sm text-ink-soft">Average recovered for a single beauty studio in 30 days.</p>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-10 py-16 border-t border-border max-w-[1240px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-faint mb-4">How it works</p>
            <h2 className="editorial-h1 text-3xl lg:text-4xl text-foreground">
              You never configure anything.
            </h2>
            <p className="mt-4 text-base text-ink-soft max-w-xl">
              Our operations team deploys, monitors, and tunes every engine. The dashboard
              exists to answer three questions: <em>how much have we recovered, what are we
              working on, and is anything blocking us.</em>
            </p>
          </div>
          <div className="card-surface p-8">
            <p className="text-xs uppercase tracking-wider text-money mb-2">Recovered this month</p>
            <p className="money-text text-5xl text-foreground">$4,820</p>
            <p className="mt-3 text-sm text-ink-soft">Across 46 bookings, 18 returned customers, and 20 new reviews.</p>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-ink-faint mb-2">Working on right now</p>
              <p className="text-sm text-foreground">23 opportunities in motion across 5 engines.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 lg:px-10 py-10 border-t border-border max-w-[1240px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-ink-faint">
          <span className="editorial-h1 text-foreground text-base">KOLVAX</span>
          <span>© {new Date().getFullYear()} KOLVAX — Revenue Recovery Platform</span>
        </div>
      </footer>
    </div>
  );
}
