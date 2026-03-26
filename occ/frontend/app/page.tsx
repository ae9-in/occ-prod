"use client";

import { Zap, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import InteractiveGrid from "@/components/InteractiveGrid";
import EnhancedHero from "@/components/EnhancedHero";
import { useEffect, useState } from "react";
import { type Post } from "@/lib/dataProvider";
import { listFeedFromApi } from "@/lib/postApi";

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);

  const handleFeaturedPostDeleted = (postId: string) => {
    setFeaturedPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  useEffect(() => {
    let isActive = true;

    const loadFeaturedPosts = async () => {
      try {
        const feed = await listFeedFromApi(1, 3);
        if (!isActive) return;
        setFeaturedPosts(feed.items);
      } catch {
        if (!isActive) return;
        setFeaturedPosts([]);
      }
    };

    loadFeaturedPosts();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center bg-brutal-gray min-h-screen relative">
      <InteractiveGrid />
      <EnhancedHero />

      {/* Community Activity Preview */}
      <section className="w-full max-w-4xl mx-auto px-4 py-20 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12 border-b-8 border-black pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-brutal-blue font-black uppercase">
                <TrendingUp className="w-6 h-6" /> Trending Now
            </div>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-black">Community Feed</h2>
          </div>
          <Link href="/feed" className="bg-white text-black border-4 border-black px-6 py-3 font-black uppercase hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none">View Full Feed</Link>
        </div>
        
        <div className="space-y-12">
          {featuredPosts.length > 0 ? (
            featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} onDeleted={handleFeaturedPostDeleted} />
            ))
          ) : (
            <div className="bg-white border-4 border-black p-10 shadow-[8px_8px_0_0_#000]">
              <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Community Feed</h3>
              <p className="mt-3 font-bold text-black/70">
                No posts are in the database yet. Sign in with the admin account to start the network cleanly.
              </p>
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
            <Link href="/feed" className="inline-block text-2xl font-black uppercase border-b-4 border-black hover:text-brutal-blue transition-all cursor-pointer">
                Discover more activity &rarr;
            </Link>
        </div>
      </section>
      
      {/* Visual Break / Features */}
      <section className="w-full bg-brutal-blue py-24 mb-24 border-y-8 border-black relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {[
                { title: "Cross-Campus", icon: <Users className="w-12 h-12" />, desc: "Connect with students from any university in the world." },
                { title: "Active Clubs", icon: <TrendingUp className="w-12 h-12" />, desc: "Find your niche or build your own community from scratch." },
                { title: "Host Events", icon: <Zap className="w-12 h-12" />, desc: "Organize meetups, workshops, and competitions seamlessly." }
            ].map((feature, idx) => (
                <div key={idx} className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] hover:-translate-y-2 transition-all">
                    <div className="mb-6 bg-brutal-gray inline-block p-4 border-2 border-black shadow-[4px_4px_0_0_#000]">{feature.icon}</div>
                    <h3 className="text-3xl font-black uppercase mb-4 text-black">{feature.title}</h3>
                    <p className="font-bold text-lg text-black/80">{feature.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-black text-white py-20 border-t-8 border-black">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
            <div className="flex gap-8 w-full justify-center">
                <span className="text-xs font-black uppercase tracking-widest opacity-50">&copy; 2026 OCC PROJECT</span>
                <span className="text-xs font-black uppercase tracking-widest opacity-50">PRIVACY POLICY</span>
                <span className="text-xs font-black uppercase tracking-widest opacity-50">TERMS OF SERVICE</span>
            </div>
        </div>
      </footer>
    </div>
  );
}


