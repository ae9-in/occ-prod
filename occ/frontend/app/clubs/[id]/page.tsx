"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Calendar, Edit3, Lock, MapPin, UserMinus, UserPlus, Users, Plus, X, Camera, Upload, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ClubFormModal from "@/components/ClubFormModal";
import ImageWithFallback from "@/components/ImageWithFallback";
import InteractiveGrid from "@/components/InteractiveGrid";
import ModalShell from "@/components/ModalShell";
import PostCard from "@/components/PostCard";
import { useUser } from "@/context/UserContext";
import { ClubRecord } from "@/lib/mockData/clubs";
import type { ClubUpsertInput } from "@/lib/clubApi";

interface ClubPageProps {
  params: Promise<{ id: string }>;
}

export default function ClubPage({ params }: ClubPageProps) {
  const { isLoggedIn, posts, clubs, addPost, joinClub, requestToJoinClub, leaveClub, isClubJoined, updateClub } = useUser();
  const router = useRouter();
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string>("");
  const [showEditClub, setShowEditClub] = useState(false);
  const [showCreateClubPost, setShowCreateClubPost] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [postSubmitError, setPostSubmitError] = useState("");
  const [clubId, setClubId] = useState<string>("");
  const [bannerFailed, setBannerFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setClubId(id);
    });
  }, [params]);

  const club = useMemo(
    () => clubs.find((item) => item.id === clubId || item.slug === clubId) as ClubRecord | undefined,
    [clubId, clubs],
  );

  useEffect(() => {
    setBannerFailed(false);
  }, [club?.bannerImage]);
  const resolvedClubId = club?.id || "";
  const clubPosts = posts.filter((post) => post.clubId === resolvedClubId);
  const isJoined = resolvedClubId ? isClubJoined(resolvedClubId) : false;
  const isOwner = !!club?.canEdit || !!club?.isOwner;
  const isPrivateClub = club?.visibility === "PRIVATE";
  const showEditButton = isOwner;
  const showLeaveButton = (club?.canLeave ?? !isOwner) && isJoined;
  const showJoinButton = !isPrivateClub && !isJoined && !isOwner && (club?.canJoin ?? true);
  const showRequestButton = isPrivateClub && !isJoined && !isOwner && (club?.canRequestToJoin ?? true);
  const showPendingRequest = !!club?.hasPendingJoinRequest && !isJoined && !isOwner;
  const canCreateClubPost = !!club?.canPost || isOwner;

  const redirectToLogin = useCallback(() => {
    router.push(`/login?next=${encodeURIComponent(clubId ? `/clubs/${clubId}` : "/explore")}`);
  }, [clubId, router]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleJoinClub = useCallback(async () => {
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }
    if (!resolvedClubId) return;
    setIsUpdatingMembership(true);
    try {
      const joined = await joinClub(resolvedClubId);
      if (joined) {
        setShowJoinSuccess(true);
        setActionFeedback("");
        setTimeout(() => setShowJoinSuccess(false), 3000);
      }
    } finally {
      setIsUpdatingMembership(false);
    }
  }, [isLoggedIn, joinClub, redirectToLogin, resolvedClubId]);

  const handleRequestToJoin = useCallback(async () => {
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }
    if (!resolvedClubId) return;
    setIsUpdatingMembership(true);
    try {
      const requested = await requestToJoinClub(resolvedClubId);
      if (requested) {
        setActionFeedback("Join request sent");
      }
    } finally {
      setIsUpdatingMembership(false);
    }
  }, [isLoggedIn, redirectToLogin, requestToJoinClub, resolvedClubId]);

  const handleLeaveClub = useCallback(async () => {
    if (!resolvedClubId) return;
    setIsUpdatingMembership(true);
    try {
      const left = await leaveClub(resolvedClubId);
      if (left) {
        setActionFeedback("");
      }
    } finally {
      setIsUpdatingMembership(false);
    }
  }, [leaveClub, resolvedClubId]);

  const handleEditClub = useCallback(async (values: ClubUpsertInput & { logoPreview?: string; bannerPreview?: string }) => {
    if (!resolvedClubId) return;

    setIsSubmittingEdit(true);
    try {
      const updated = await updateClub(resolvedClubId, values);
      if (updated) {
        setShowEditClub(false);
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  }, [resolvedClubId, updateClub]);

  const handleOpenCreateClubPost = useCallback(() => {
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }
    if (!canCreateClubPost) {
      return;
    }
    setShowCreateClubPost(true);
  }, [canCreateClubPost, isLoggedIn, redirectToLogin]);

  const handleCloseCreateClubPost = useCallback(() => {
    setShowCreateClubPost(false);
    setPostContent("");
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageError("");
    setPostSubmitError("");
    setIsSubmittingPost(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imagePreview]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5MB.");
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError("");
  }, [imagePreview]);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imagePreview]);

  const handleSubmitClubPost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolvedClubId || !postContent.trim() || isSubmittingPost) {
      return;
    }

    setIsSubmittingPost(true);
    setPostSubmitError("");

    try {
      const created = await addPost({
        content: postContent,
        clubId: resolvedClubId,
        imageFile: selectedImage,
      });

      if (!created) {
        setPostSubmitError("We couldn't publish this club post right now.");
        return;
      }

      handleCloseCreateClubPost();
    } catch {
      setPostSubmitError("We couldn't publish this club post right now.");
    } finally {
      setIsSubmittingPost(false);
    }
  }, [addPost, handleCloseCreateClubPost, isSubmittingPost, postContent, resolvedClubId, selectedImage]);

  if (!clubId) {
    return (
      <div className="min-h-screen bg-brutal-gray flex items-center justify-center">
        <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0_0_#000] text-center">
          <h1 className="text-4xl font-black uppercase mb-4">Loading Club...</h1>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-brutal-gray flex items-center justify-center px-4">
        <div className="max-w-xl border-4 border-black bg-white p-10 text-center shadow-[8px_8px_0_0_#000]">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Club Not Found</h1>
          <p className="mt-4 text-lg font-bold text-gray-600">
            We couldn&apos;t find that club right now. It may have been removed or failed to load.
          </p>
          <button
            type="button"
            onClick={() => router.push("/explore")}
            className="mt-8 border-4 border-black bg-black px-6 py-3 font-black uppercase text-white shadow-[4px_4px_0_0_#1d2cf3] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const safeBannerImage = club.bannerImage?.trim() || "";
  const safeProfileImage = club.profileImage?.trim() || club.logo?.trim() || "/globe.svg";
  const showBanner = !!safeBannerImage && !bannerFailed;

  return (
    <div className="min-h-screen bg-[#ececef]">
      <div className="relative overflow-hidden border-b-8 border-black bg-[#e9ebef]">
        {showBanner ? (
          <>
            <img
              src={safeBannerImage}
              alt={`${club.name} banner`}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setBannerFailed(true)}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,18,0.18)_0%,rgba(8,10,18,0.52)_68%,rgba(8,10,18,0.72)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_34%),radial-gradient(circle_at_70%_20%,rgba(29,44,243,0.2),transparent_30%)]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#f7f7f4_0%,#eceff3_48%,#dde2ee_100%)]" />
            <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/65 blur-3xl" />
            <div className="absolute right-[-3rem] top-[-2rem] h-72 w-72 rounded-full bg-[#1d2cf3]/10 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.06)_100%)]" />
            <div className="absolute inset-0 opacity-[0.22]">
              <InteractiveGrid variant="page" scope="container" />
            </div>
          </>
        )}

        <div className="relative">
          <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-16">
            <div className="relative overflow-hidden rounded-[2rem] border-4 border-black bg-white/84 p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.9)] backdrop-blur-sm md:p-8">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.55),rgba(255,255,255,0.12))]" />
              <div className="absolute inset-y-0 right-0 hidden w-1/3 border-l-4 border-black/10 bg-[linear-gradient(180deg,rgba(29,44,243,0.08),rgba(255,255,255,0))] md:block" />
              <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-6 md:flex-row md:items-end">
                  <div className="h-24 w-24 overflow-hidden rounded-[1.75rem] border-4 border-black bg-white shadow-[7px_7px_0_0_#000] md:h-32 md:w-32">
                    <ImageWithFallback
                      src={safeProfileImage}
                      fallbackSrc="/globe.svg"
                      alt={`${club.name} logo`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 border-2 border-black bg-white/90 px-3 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-brutal-blue shadow-[3px_3px_0_0_#000]">
                      OCC Club
                    </div>
                    <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter text-black md:text-5xl xl:text-6xl">
                      {club.name}
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg font-black leading-snug text-[#23315d] md:text-[1.65rem]">
                      {club.tagline}
                    </p>
                    <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-gray-700 md:text-lg">
                      {club.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <span className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-gray-600 shadow-[2px_2px_0_0_#000]">
                        {club.category}
                      </span>
                      <span className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-gray-600 shadow-[2px_2px_0_0_#000]">
                        {club.university}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex w-full max-w-xs flex-col gap-3 md:items-stretch">
                  {showJoinSuccess ? (
                    <div className="bg-green-500 text-white p-3 border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase text-sm">
                      Joined {club.name}!
                    </div>
                  ) : null}

                  {!showJoinSuccess && actionFeedback ? (
                    <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase text-sm text-black">
                      {actionFeedback}
                    </div>
                  ) : null}

                  {showEditButton ? (
                    <button
                      onClick={() => setShowEditClub(true)}
                      className="flex items-center justify-center gap-2 border-4 border-black bg-white px-6 py-4 font-black uppercase text-black shadow-[6px_6px_0_0_#000] transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-none"
                    >
                      <Edit3 className="h-5 w-5" />
                      Edit Club
                    </button>
                  ) : null}

                  {canCreateClubPost ? (
                    <button
                      onClick={handleOpenCreateClubPost}
                      className="flex items-center justify-center gap-2 border-4 border-black bg-black px-6 py-4 font-black uppercase text-white shadow-[6px_6px_0_0_#1d2cf3] transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-none"
                    >
                      <Plus className="h-5 w-5" />
                      Create Club Post
                    </button>
                  ) : null}

                  {showLeaveButton ? (
                    <button
                      onClick={handleLeaveClub}
                      disabled={isUpdatingMembership}
                      className="flex min-h-14 items-center justify-center gap-2 border-4 border-black bg-white px-6 py-4 font-black uppercase text-black shadow-[6px_6px_0_0_#000] transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-none"
                    >
                      <UserMinus className="h-5 w-5" />
                      {isUpdatingMembership ? "Leaving..." : "Leave Club"}
                    </button>
                  ) : null}

                  {showJoinButton ? (
                    <button
                      onClick={handleJoinClub}
                      disabled={isUpdatingMembership}
                      className="flex min-h-14 items-center justify-center gap-2 border-4 border-black bg-black px-6 py-4 font-black uppercase text-white shadow-[6px_6px_0_0_#1d2cf3] transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-none"
                    >
                      <UserPlus className="h-5 w-5" />
                      {isUpdatingMembership ? "Joining..." : "Join Club"}
                    </button>
                  ) : null}

                  {showRequestButton ? (
                    <button
                      onClick={handleRequestToJoin}
                      disabled={isUpdatingMembership}
                      className="flex min-h-14 items-center justify-center gap-2 border-4 border-black bg-black px-6 py-4 font-black uppercase text-white shadow-[6px_6px_0_0_#1d2cf3] transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-none"
                    >
                      <Lock className="h-5 w-5" />
                      {isUpdatingMembership ? "Sending..." : "Request To Join"}
                    </button>
                  ) : null}

                  {showPendingRequest ? (
                    <div className="flex min-h-14 items-center justify-center gap-2 border-4 border-black bg-[#f5f6fa] px-6 py-4 font-black uppercase text-black shadow-[6px_6px_0_0_#000]">
                      <Lock className="h-5 w-5" />
                      Request Pending
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          <div className="border-4 border-black bg-white/95 p-8 text-center shadow-[8px_8px_0_0_#000]">
            <Users className="mx-auto mb-4 h-12 w-12" />
            <p className="mb-2 text-5xl font-black">{club.membersCount}</p>
            <p className="text-sm font-black uppercase tracking-widest text-gray-600">Members</p>
          </div>
          <div className="border-4 border-black bg-white/95 p-8 text-center shadow-[8px_8px_0_0_#000]">
            <Calendar className="mx-auto mb-4 h-12 w-12" />
            <p className="mb-2 text-5xl font-black">{club.eventsCount}</p>
            <p className="text-sm font-black uppercase tracking-widest text-gray-600">Events</p>
          </div>
          <div className="border-4 border-black bg-white/95 p-8 text-center shadow-[8px_8px_0_0_#000]">
            <MapPin className="mx-auto mb-4 h-12 w-12" />
            <p className="mb-2 text-lg font-black">{club.location}</p>
            <p className="text-sm font-black uppercase tracking-widest text-gray-600">Location</p>
          </div>
        </div>

        <div className="my-16 h-1 w-32 bg-gradient-to-r from-brutal-blue via-brutal-blue to-transparent" />

        <div className="mb-16 border-4 border-black bg-white/95 p-8 shadow-[8px_8px_0_0_#000] md:p-10">
          <h2 className="mb-6 border-b-4 border-black pb-4 text-3xl font-black uppercase tracking-tighter">
            About This Club
          </h2>
          <p className="mb-6 text-lg font-bold leading-relaxed text-gray-700">{club.description}</p>
          <p className="text-lg font-bold leading-relaxed text-gray-700">{club.fullDescription}</p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="border-4 border-black bg-white/95 p-8 shadow-[8px_8px_0_0_#000]">
            <h2 className="mb-6 border-b-4 border-black pb-4 text-3xl font-black uppercase tracking-tighter">
              Members ({club.members.length})
            </h2>
            {club.members.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {club.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 border-2 border-black bg-[#f1f2f5] p-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-black bg-white">
                      <ImageWithFallback
                        src={member.avatar?.trim() || "/globe.svg"}
                        fallbackSrc="/globe.svg"
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-black">{member.name}</p>
                      <p className="text-sm font-bold uppercase tracking-widest text-gray-600">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center font-bold text-gray-500">No members to display</p>
            )}
          </div>

          <div className="border-4 border-black bg-white/95 p-8 shadow-[8px_8px_0_0_#000]">
            <h2 className="mb-6 border-b-4 border-black pb-4 text-3xl font-black uppercase tracking-tighter">
              Upcoming Events
            </h2>
            {club.events.length > 0 ? (
              <div className="space-y-4">
                {club.events.map((event) => (
                  <div key={event.id} className="border-4 border-black bg-[#f1f2f5] p-4">
                    <h3 className="mb-2 text-lg font-black uppercase">{event.title}</h3>
                    <div className="mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-bold">{event.date}</span>
                    </div>
                    <div className="mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-bold">{event.location}</span>
                    </div>
                    <p className="font-bold text-gray-700">{event.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center font-bold text-gray-500">No upcoming events</p>
            )}
          </div>
        </div>

        <div className="my-16 h-1 w-32 bg-gradient-to-r from-brutal-blue via-brutal-blue to-transparent" />

        <div className="mb-16 border-4 border-black bg-white/95 p-8 shadow-[8px_8px_0_0_#000]">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="border-b-4 border-black pb-4 text-3xl font-black uppercase tracking-tighter">
              Club Posts ({clubPosts.length})
            </h2>
            <div className="border-2 border-black bg-brutal-blue px-4 py-2 text-sm font-black uppercase text-white shadow-[2px_2px_0_0_#000]">
              {club.name}
            </div>
          </div>
          {clubPosts.length > 0 ? (
            <div className="space-y-8">
              {clubPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="mb-4 text-lg font-bold text-gray-500">No posts from this club yet.</p>
              <p className="font-bold text-gray-400">Be the first to share something with the community.</p>
              {canCreateClubPost ? (
                <button
                  type="button"
                  onClick={handleOpenCreateClubPost}
                  className="mt-6 border-4 border-black bg-black px-6 py-3 font-black uppercase text-white shadow-[4px_4px_0_0_#1d2cf3] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  Create The First Club Post
                </button>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-4 border-black bg-white/95 p-8 shadow-[8px_8px_0_0_#000]">
          <h2 className="mb-6 border-b-4 border-black pb-4 text-3xl font-black uppercase tracking-tighter">
            Club Media
          </h2>
          {club.gallery.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {club.gallery.map((item) => (
                <div key={item.id} className="overflow-hidden border-4 border-black shadow-[4px_4px_0_0_#000] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(37,64,255,0.3)]">
                  <div className="aspect-square bg-[#f1f2f5]">
                    <ImageWithFallback
                      src={item.image?.trim() || "/window.svg"}
                      fallbackSrc="/window.svg"
                      alt={item.caption}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="border-t-2 border-t-brutal-blue bg-white p-3">
                    <p className="text-sm font-bold">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center font-bold text-gray-500">No media to display</p>
          )}
        </div>
      </div>

      {showEditClub ? (
        <ClubFormModal
          mode="edit"
          initialValues={{
            name: club.name,
            description: club.fullDescription || club.description,
            category: club.category,
            university: club.university,
            location: club.location,
            logoPreview: club.logo,
            bannerPreview: club.bannerImage,
          }}
          isSubmitting={isSubmittingEdit}
          onClose={() => setShowEditClub(false)}
          onSubmit={handleEditClub}
        />
      ) : null}

      {showCreateClubPost ? (
        <ModalShell
          className="bg-white border-8 border-black shadow-[16px_16px_0_0_#1d2cf3] max-w-2xl w-full max-h-[calc(100vh-3rem)] overflow-y-auto"
          onClose={handleCloseCreateClubPost}
        >
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between border-b-4 border-black pb-4">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Create Club Post</h2>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-brutal-blue">
                  Posting in {club.name}
                </p>
              </div>
              <button
                onClick={handleCloseCreateClubPost}
                className="p-2 transition-colors hover:bg-brutal-gray"
                aria-label="Close club post modal"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <form onSubmit={handleSubmitClubPost} className="space-y-6">
              <div className="border-2 border-black bg-[#f4f5fb] p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-500">Club Context</p>
                <p className="mt-2 text-2xl font-black uppercase">{club.name}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-widest text-gray-600">
                  What&apos;s happening in {club.name}?
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={5}
                  required
                  placeholder={`Share an update with ${club.name}...`}
                  className="w-full resize-none border-4 border-black p-4 text-lg font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black uppercase tracking-widest text-gray-600">
                  Image (Optional)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative mb-4">
                    <img
                      src={imagePreview}
                      alt="Club post preview"
                      className="max-h-72 w-full border-4 border-black object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-2 top-2 border-2 border-black bg-red-500 p-2 text-white shadow-[2px_2px_0_0_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                      aria-label="Remove selected image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-white px-6 py-3 text-sm font-black uppercase shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute("capture", "environment");
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-white px-6 py-3 text-sm font-black uppercase shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </button>
                  </div>
                )}

                {imageError ? (
                  <p className="mt-2 border-l-4 border-red-500 pl-2 text-sm font-bold text-red-500">{imageError}</p>
                ) : null}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="flex-1 border-4 border-black bg-black px-8 py-4 text-lg font-black uppercase text-white shadow-[6px_6px_0_0_#1d2cf3] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  {isSubmittingPost ? "Posting..." : "Publish Club Post"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCreateClubPost}
                  className="flex-1 border-4 border-black bg-white px-8 py-4 text-lg font-black uppercase text-black shadow-[6px_6px_0_0_#000] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  Cancel
                </button>
              </div>

              {postSubmitError ? (
                <p className="border-l-4 border-red-600 pl-3 text-sm font-bold text-red-600">{postSubmitError}</p>
              ) : null}
            </form>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
