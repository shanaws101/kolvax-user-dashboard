import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — KOLVAX" },
      { name: "description", content: "Sign in to your KOLVAX dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});
const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, "Tell us your name"),
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-surface-muted border-r border-border">
        <Link to="/" className="editorial-h1 text-xl">KOLVAX</Link>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-money mb-4">Revenue Recovery Platform</p>
          <p className="editorial-h1 text-3xl text-foreground max-w-md">
            "We recovered $4,820 last month — and I didn't have to do a thing."
          </p>
          <p className="mt-4 text-sm text-ink-soft">Maria Alvarez, Bella Beauty Studio</p>
        </div>
        <p className="text-xs text-ink-faint">© {new Date().getFullYear()} KOLVAX</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden editorial-h1 text-xl block mb-8">KOLVAX</Link>
          <h1 className="editorial-h1 text-3xl text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {mode === "signin"
              ? "Sign in to your KOLVAX dashboard."
              : "Your operations team will finish setup within 48 hours."}
          </p>

          {mode === "signin" ? (
            <SignInForm onSuccess={() => navigate({ to: "/app" })} />
          ) : (
            <SignUpForm onSuccess={() => navigate({ to: "/app" })} />
          )}

          <p className="mt-6 text-sm text-ink-soft">
            {mode === "signin" ? "New to KOLVAX?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-money font-medium hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
  });
  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) return toast.error(error.message);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <Field label="Email" error={errors.email?.message}>
        <input type="email" autoComplete="email" {...register("email")} className={inputCls} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input type="password" autoComplete="current-password" {...register("password")} className={inputCls} />
      </Field>
      <button type="submit" disabled={isSubmitting} className={btnCls}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </button>
    </form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
  });
  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin + "/app",
        data: { full_name: data.fullName },
      },
    });
    if (error) return toast.error(error.message);
    toast.success("Account created. Welcome.");
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <Field label="Full name" error={errors.fullName?.message}>
        <input type="text" autoComplete="name" {...register("fullName")} className={inputCls} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" autoComplete="email" {...register("email")} className={inputCls} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input type="password" autoComplete="new-password" {...register("password")} className={inputCls} />
      </Field>
      <button type="submit" disabled={isSubmitting} className={btnCls}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </button>
    </form>
  );
}

const inputCls = "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-money focus:ring-2 focus:ring-money/20";
const btnCls = "w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-soft mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
