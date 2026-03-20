"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useTransition } from "@/context/TransitionContext";
import PublicPageGrid from "@/components/PublicPageGrid";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn, isAuthLoading } = useUser();
  const { triggerEntryTransition, isTransitioning } = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/feed");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisteredMessage, setShowRegisteredMessage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/feed");
    setShowRegisteredMessage(params.get("registered") === "1");
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      router.push(nextPath);
    }
  }, [isAuthLoading, isLoggedIn, router, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTransitioning || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      triggerEntryTransition(nextPath);
    } catch {
      setError("Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageGrid className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0_0_#000] relative">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-8 border-b-4 border-black pb-4">
          Join OCC<span className="text-brutal-blue">.</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {showRegisteredMessage ? (
            <p className="border-l-4 border-brutal-blue pl-3 text-sm font-black uppercase text-brutal-blue">
              Registration complete. Log in to start exploring OCC.
            </p>
          ) : null}

          <div>
            <label className="block font-black uppercase text-sm mb-2 tracking-widest">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:bg-brutal-gray transition-colors"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block font-black uppercase text-sm mb-2 tracking-widest">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:bg-brutal-gray transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {error ? (
            <p className="border-l-4 border-red-600 pl-3 text-sm font-black uppercase text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-black uppercase py-5 text-xl border-4 border-black shadow-[6px_6px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {isSubmitting ? "Signing In..." : "Enter OCC"} <ArrowRight className="w-6 h-6" />
          </button>
        </form>

        <p className="mt-6 text-sm font-bold text-black/70">
          New to OCC?{" "}
          <Link href="/register" className="font-black uppercase text-brutal-blue hover:underline">
            Create your student account
          </Link>
        </p>
      </div>
    </PublicPageGrid>
  );
}
