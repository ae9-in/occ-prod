"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ShieldCheck, Users, University } from "lucide-react";
import PublicPageGrid from "@/components/PublicPageGrid";
import { useTransition } from "@/context/TransitionContext";
import { useUser } from "@/context/UserContext";
import { registerStudent } from "@/lib/authApi";

const PHONE_PATTERN = /^[+]?[\d\s\-()]{10,30}$/;

export default function RegisterPage() {
  const router = useRouter();
  const { isLoggedIn, isAuthLoading } = useUser();
  const { triggerEntryTransition, isTransitioning } = useTransition();
  const [form, setForm] = useState({
    fullName: "",
    collegeName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      router.push("/feed");
    }
  }, [isAuthLoading, isLoggedIn, router]);

  const helperText = useMemo(
    () => [
      {
        icon: University,
        title: "Built for campus identity",
        description: "Join OCC with your real college details so clubs and local communities feel relevant from day one.",
      },
      {
        icon: Users,
        title: "Student-first onboarding",
        description: "Your account starts as a normal community member, ready to explore clubs, events, and discussions.",
      },
      {
        icon: ShieldCheck,
        title: "Safe role separation",
        description: "Registration never creates admin accounts. Student signups stay strictly at USER access level.",
      },
    ],
    [],
  );

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.collegeName.trim()) nextErrors.collegeName = "College name is required.";
    if (!form.phoneNumber.trim()) {
      nextErrors.phoneNumber = "Phone number is required.";
    } else if (!PHONE_PATTERN.test(form.phoneNumber.trim())) {
      nextErrors.phoneNumber = "Enter a valid phone number.";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isTransitioning || isSubmitting) return;

    setSubmitError("");
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await registerStudent({
        displayName: form.fullName.trim(),
        university: form.collegeName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      triggerEntryTransition("/login?registered=1");
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : "We couldn't create your account right now.";
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <PublicPageGrid className="min-h-screen bg-transparent px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="border-4 border-black bg-black p-8 text-white shadow-[12px_12px_0_0_#1d2cf3] md:p-12">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-blue">Student Onboarding</p>
          <h1 className="mt-4 text-5xl font-black uppercase leading-[0.88] tracking-tighter md:text-7xl">
            Join OCC
          </h1>
          <p className="mt-6 max-w-xl border-l-4 border-brutal-blue pl-4 text-lg font-bold text-white/80">
            Set up your off-campus club identity with the essentials students actually use: name, college, phone, email, and a secure password.
          </p>

          <div className="mt-10 space-y-4">
            {helperText.map((item) => (
              <div key={item.title} className="border-4 border-white/20 bg-white/5 p-5 backdrop-blur-[1px]">
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-brutal-blue" />
                  <h2 className="text-lg font-black uppercase">{item.title}</h2>
                </div>
                <p className="mt-3 font-bold text-white/75">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-4 border-black bg-white p-8 shadow-[12px_12px_0_0_#000] md:p-12">
          <div className="border-b-4 border-black pb-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-black md:text-5xl">
              Create Your Student Account
            </h2>
            <p className="mt-3 font-bold text-black/65">
              Start as a normal OCC member and explore communities around your campus network.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full border-4 border-black bg-white p-4 text-lg font-bold focus:outline-none focus:bg-brutal-gray transition-colors"
              />
              {errors.fullName ? <p className="mt-2 text-sm font-black uppercase text-red-600">{errors.fullName}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-black uppercase tracking-widest">College Name</label>
              <input
                type="text"
                value={form.collegeName}
                onChange={(e) => updateField("collegeName", e.target.value)}
                placeholder="Delhi University"
                className="w-full border-4 border-black bg-white p-4 text-lg font-bold focus:outline-none focus:bg-brutal-gray transition-colors"
              />
              {errors.collegeName ? <p className="mt-2 text-sm font-black uppercase text-red-600">{errors.collegeName}</p> : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-widest">Phone Number</label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border-4 border-black bg-white p-4 text-lg font-bold focus:outline-none focus:bg-brutal-gray transition-colors"
                />
                {errors.phoneNumber ? <p className="mt-2 text-sm font-black uppercase text-red-600">{errors.phoneNumber}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@college.edu"
                  className="w-full border-4 border-black bg-white p-4 text-lg font-bold focus:outline-none focus:bg-brutal-gray transition-colors"
                />
                {errors.email ? <p className="mt-2 text-sm font-black uppercase text-red-600">{errors.email}</p> : null}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-widest">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border-4 border-black bg-white p-4 text-lg font-bold focus:outline-none focus:bg-brutal-gray transition-colors"
                />
                {errors.password ? <p className="mt-2 text-sm font-black uppercase text-red-600">{errors.password}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-widest">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full border-4 border-black bg-white p-4 text-lg font-bold focus:outline-none focus:bg-brutal-gray transition-colors"
                />
                {errors.confirmPassword ? <p className="mt-2 text-sm font-black uppercase text-red-600">{errors.confirmPassword}</p> : null}
              </div>
            </div>

            {submitError ? (
              <p className="border-l-4 border-red-600 pl-3 text-sm font-black uppercase text-red-600">
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-3 border-4 border-black bg-black py-5 text-xl font-black uppercase text-white shadow-[6px_6px_0_0_#1d2cf3] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Creating Account..." : "Join OCC"} <ArrowRight className="h-6 w-6" />
            </button>
          </form>

          <p className="mt-6 text-sm font-bold text-black/70">
            Already have an account?{" "}
            <Link href="/login" className="font-black uppercase text-brutal-blue hover:underline">
              Login here
            </Link>
          </p>
        </section>
      </div>
    </PublicPageGrid>
  );
}
