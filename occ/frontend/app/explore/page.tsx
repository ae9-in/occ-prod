"use client";

import { useState, useCallback } from "react";
import ClubCard from "@/components/ClubCard";
import ClubFormModal from "@/components/ClubFormModal";
import InteractiveGrid from "@/components/InteractiveGrid";
import { Search, Map, Filter, Globe, X } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from "next/navigation";
import type { ClubUpsertInput } from "@/lib/clubApi";

export default function ExplorePage() {
  const { clubs, createClub, isLoggedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [isSubmittingClub, setIsSubmittingClub] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    university: "all",
    memberCount: "all"
  });

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filters.category === "all" || club.category === filters.category;
    const matchesUniversity =
      filters.university === "all" || club.university === filters.university;
    const matchesMemberCount =
      filters.memberCount === "all" ||
      (filters.memberCount === "small" && (club.membersCount ?? 0) <= 50) ||
      (filters.memberCount === "medium" && (club.membersCount ?? 0) > 50 && (club.membersCount ?? 0) <= 200) ||
      (filters.memberCount === "large" && (club.membersCount ?? 0) > 200);
    return matchesSearch && matchesCategory && matchesUniversity && matchesMemberCount;
  });

  const handleFilterToggle = useCallback(() => {
    setShowFilter(!showFilter);
  }, [showFilter]);

  const handleMapToggle = useCallback(() => {
    setShowMapView(!showMapView);
  }, [showMapView]);

  const openCreateClub = useCallback(() => {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname ?? "/explore")}`);
      return;
    }
    setShowCreateClub(true);
  }, [isLoggedIn, pathname, router]);

  const closeCreateClub = useCallback(() => {
    setShowCreateClub(false);
  }, []);

  const handleCreateClub = useCallback(async (clubForm: ClubUpsertInput & { logoPreview?: string; bannerPreview?: string }) => {
    if (!clubForm.name.trim() || !clubForm.description.trim()) return;

    setIsSubmittingClub(true);
    try {
      const newClubId = await createClub(clubForm);
      closeCreateClub();

      if (newClubId) {
        router.push(`/clubs/${newClubId}`);
      }
    } finally {
      setIsSubmittingClub(false);
    }
  }, [closeCreateClub, createClub, router]);

  return (
    <div className="min-h-screen bg-brutal-gray">
      {/* Header */}
      <div className="bg-white text-black p-12 md:p-24 border-b-8 border-black relative overflow-hidden">
        <InteractiveGrid variant="page" scope="container" />
        <div className="absolute inset-0 bg-white/72"></div>
        <div className="absolute right-0 top-0 w-1/3 h-full bg-brutal-blue opacity-5 -skew-x-12 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 text-brutal-blue font-black uppercase tracking-widest mb-6">
            <Globe className="w-6 h-6" /> Discovery Mode
          </div>
          <h1 className="text-6xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter mb-12">
            Off Campus <br /> 
            <span className="bg-black text-white px-6 inline-block shadow-[12px_12px_0_0_#1d2cf3]">Clubs</span>
          </h1>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
            <p className="text-2xl font-black max-w-xl border-l-8 border-black pl-8 bg-brutal-gray p-6 shadow-[6px_6px_0_0_#000]">
              Discover, join, and lead student communities across every campus in our network.
            </p>
            
            <div className="w-full md:w-[450px] space-y-4">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="SEARCH CLUBS, TAGS, CATEGORIES..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-4 border-black p-6 text-black font-black text-xl focus:outline-none focus:shadow-[8px_8px_0_0_#1d2cf3] transition-all placeholder:text-gray-300 shadow-[6px_6px_0_0_#000]"
                />
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-black w-8 h-8 group-focus-within:text-brutal-blue transition-colors" />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleFilterToggle}
                  className={`flex-1 border-4 border-black py-3 font-black uppercase text-sm flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none ${showFilter ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                >
                  <Filter className="w-4 h-4"/> Filter
                </button>
                <button 
                  onClick={handleMapToggle}
                  className={`flex-1 border-4 border-black py-3 font-black uppercase text-sm flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none ${showMapView ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                >
                  <Map className="w-4 h-4"/> Map View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-baseline gap-4 mb-16 px-4 md:px-0">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            {showMapView ? "Map View" : "Verified Communities"}
          </h2>
          <span className="text-gray-400 font-black uppercase text-xl">({filteredClubs.length})</span>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="mb-12 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000]">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 className="text-2xl font-black uppercase">Filters</h3>
              <button onClick={() => setShowFilter(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                >
                  <option value="all">All Categories</option>
                  <option value="Creative">Creative</option>
                  <option value="Academic">Academic</option>
                  <option value="Sports">Sports</option>
                  <option value="Technology">Technology</option>
                  <option value="Social">Social</option>
                </select>
              </div>
              <div>
                <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                  University
                </label>
                <select
                  value={filters.university}
                  onChange={(e) => setFilters({ ...filters, university: e.target.value })}
                  className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                >
                  <option value="all">All Universities</option>
                  <option value="PES University">PES University</option>
                  <option value="MIT">MIT</option>
                  <option value="Stanford">Stanford</option>
                </select>
              </div>
              <div>
                <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                  Size
                </label>
                <select
                  value={filters.memberCount}
                  onChange={(e) => setFilters({ ...filters, memberCount: e.target.value })}
                  className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                >
                  <option value="all">Any Size</option>
                  <option value="small">Small (1-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="large">Large (200+)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Map View */}
        {showMapView ? (
          <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0_0_#000] text-center">
            <div className="bg-brutal-gray border-4 border-black p-20 mb-8">
              <Map className="w-24 h-24 mx-auto mb-6 text-gray-400" />
              <h3 className="text-4xl font-black uppercase mb-4">Interactive Map</h3>
              <p className="font-bold text-gray-600 text-lg">
                Coming Soon: Explore clubs by location and see campus hotspots.
              </p>
            </div>
            <button 
              onClick={() => setShowMapView(false)}
              className="bg-black text-white px-8 py-4 font-black uppercase border-4 border-black shadow-[6px_6px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Back to Grid View
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredClubs.map(club => (
              <ClubCard key={club.id} club={club} />
            ))}
            
            {/* Add Club Placeholder */}
            <button
              type="button"
              onClick={openCreateClub}
              className="border-4 border-dashed border-black bg-white/50 p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white hover:border-solid transition-all min-h-[300px] w-full"
            >
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-5xl font-black leading-none">+</span>
              </div>
              <h3 className="text-2xl font-black uppercase mb-2">Start a new club</h3>
              <p className="font-bold text-gray-500">Can&apos;t find what you&apos;re looking for? Build it yourself.</p>
            </button>
          </div>
        )}
      </div>

      {showCreateClub ? (
        <ClubFormModal
          mode="create"
          isSubmitting={isSubmittingClub}
          onClose={closeCreateClub}
          onSubmit={handleCreateClub}
        />
      ) : null}
    </div>
  );
}
