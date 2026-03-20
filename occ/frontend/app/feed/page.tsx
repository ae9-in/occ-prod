"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import PostCard from "@/components/PostCard";
import InteractiveGrid from "@/components/InteractiveGrid";
import { Zap, LayoutDashboard, Info, X, Plus, Camera, Upload, Trash2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from "next/navigation";
import type { Post } from "@/lib/dataProvider";
import { listFeedFromApi, type FeedSettingsInput } from "@/lib/postApi";
import ModalShell from "@/components/ModalShell";

const FEED_SETTINGS_STORAGE_KEY = "occ-feed-settings";

const defaultFeedSettings: Required<FeedSettingsInput> = {
  sortBy: "latest",
  showClubPosts: true,
  showGeneralPosts: true,
};

const readStoredFeedSettings = (): Required<FeedSettingsInput> => {
  if (typeof window === "undefined") {
    return defaultFeedSettings;
  }

  try {
    const raw = localStorage.getItem(FEED_SETTINGS_STORAGE_KEY);
    if (!raw) return defaultFeedSettings;
    const parsed = JSON.parse(raw) as FeedSettingsInput;
    return {
      sortBy: parsed.sortBy === "popular" ? "popular" : "latest",
      showClubPosts: parsed.showClubPosts ?? true,
      showGeneralPosts: parsed.showGeneralPosts ?? true,
    };
  } catch {
    return defaultFeedSettings;
  }
};

export default function FeedPage() {
  const { isLoggedIn, addPost, clubs } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showFeedSettings, setShowFeedSettings] = useState(false);
  const [feedSettings, setFeedSettings] = useState<Required<FeedSettingsInput>>(readStoredFeedSettings);
  const [draftFeedSettings, setDraftFeedSettings] = useState<Required<FeedSettingsInput>>(readStoredFeedSettings);
  const [postForm, setPostForm] = useState({
    content: "",
    clubName: "General"
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string>("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postSubmitError, setPostSubmitError] = useState<string>("");
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isApplyingFeedSettings, setIsApplyingFeedSettings] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [feedEmptyMessage, setFeedEmptyMessage] = useState("No activity yet. Be the first to post!");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const joinedClubs = clubs.filter((club) => club.isJoined || club.isOwner);

  const doesPostMatchFeedSettings = useCallback((clubId?: string | null) => {
    const isClubPost = !!clubId && clubId !== "general";
    if (isClubPost) {
      return feedSettings.showClubPosts;
    }
    return feedSettings.showGeneralPosts;
  }, [feedSettings.showClubPosts, feedSettings.showGeneralPosts]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCreatePost(false);
      }
    };

    if (showCreatePost) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showCreatePost]);

  // Clean up image preview URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    let isActive = true;

    const hydrateFeed = async () => {
      try {
        setFeedError("");
        const feed = await listFeedFromApi(1, 10, feedSettings);
        if (!isActive) return;
        setFeedPosts(feed.items);
        setCurrentPage(feed.page);
        setTotalPages(feed.totalPages);
        setFeedEmptyMessage(
          feedSettings.showClubPosts || feedSettings.showGeneralPosts
            ? "No posts match your current feed settings."
            : "Choose at least one post type to see your feed.",
        );
      } catch {
        // Keep local feed when the API is unavailable.
        if (!isActive) return;
        setFeedError("We couldn't refresh the feed right now.");
      }
    };

    hydrateFeed();

    return () => {
      isActive = false;
    };
  }, [feedSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FEED_SETTINGS_STORAGE_KEY, JSON.stringify(feedSettings));
  }, [feedSettings]);

  const handleCreatePost = useCallback(() => {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname ?? "/feed")}`);
      return;
    }
    setShowCreatePost(true);
  }, [isLoggedIn, pathname, router]);

  const handleOpenFeedSettings = useCallback(() => {
    setDraftFeedSettings(feedSettings);
    setShowFeedSettings(true);
  }, [feedSettings]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || currentPage >= totalPages) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const feed = await listFeedFromApi(nextPage, 10, feedSettings);
      setFeedPosts((prev) => [...prev, ...feed.items]);
      setCurrentPage(feed.page);
      setTotalPages(feed.totalPages);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, feedSettings, isLoadingMore, totalPages]);

  const handleCloseFeedSettings = useCallback(() => {
    setShowFeedSettings(false);
  }, []);

  const handleApplyFeedSettings = useCallback(async () => {
    setIsApplyingFeedSettings(true);
    try {
      setFeedSettings(draftFeedSettings);
      setCurrentPage(1);
      setShowFeedSettings(false);
    } finally {
      setIsApplyingFeedSettings(false);
    }
  }, [draftFeedSettings]);

  const handleFeedFilterToggle = useCallback(
    (key: "showClubPosts" | "showGeneralPosts", value: boolean) => {
      const nextSettings = { ...draftFeedSettings, [key]: value };
      if (!nextSettings.showClubPosts && !nextSettings.showGeneralPosts) {
        setDraftFeedSettings({
          ...nextSettings,
          [key === "showClubPosts" ? "showGeneralPosts" : "showClubPosts"]: true,
        });
        return;
      }
      setDraftFeedSettings(nextSettings);
    },
    [draftFeedSettings],
  );

  const handleCloseModal = useCallback(() => {
    setShowCreatePost(false);
    setPostForm({
      content: "",
      clubName: "General"
    });
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageError("");
    setPostSubmitError("");
    setIsSubmittingPost(false);
  }, [imagePreview]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setImageError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError("Please select a valid image file");
      return;
    }

    setImageError("");
    setSelectedImage(file);
    
    // Create preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }, [imagePreview]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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

  const handleSubmitPost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingPost || !postForm.content.trim()) {
      return;
    }

    const selectedClub = joinedClubs.find((club) => club.name === postForm.clubName);
    setIsSubmittingPost(true);
    setPostSubmitError("");

    try {
      const created = await addPost({
        content: postForm.content,
        clubId: selectedClub?.id || null,
        imageFile: selectedImage,
      });

      if (!created) {
        setPostSubmitError("We couldn't create your post right now.");
        return;
      }

      if (doesPostMatchFeedSettings(created.clubId)) {
        setFeedPosts((prev) => {
          const nextPosts = [created, ...prev];
          if (feedSettings.sortBy === "popular") {
            return [...nextPosts].sort((a, b) => b.likes - a.likes);
          }
          return nextPosts;
        });
      }

      handleCloseModal();
    } catch {
      setPostSubmitError("We couldn't create your post right now.");
    } finally {
      setIsSubmittingPost(false);
    }
  }, [addPost, doesPostMatchFeedSettings, feedSettings.sortBy, handleCloseModal, isSubmittingPost, joinedClubs, postForm, selectedImage]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 pt-12 px-4 md:px-0">
      {/* Feed Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-black text-white p-8 md:p-12 border-8 border-black shadow-[12px_12px_0_0_#1d2cf3] relative overflow-hidden group">
        <InteractiveGrid variant="page" scope="container" />
        <div className="absolute inset-0 bg-black/65 pointer-events-none"></div>
        <div className="absolute -right-10 -top-10 text-[200px] text-white opacity-10 font-black leading-none select-none pointer-events-none -rotate-12 group-hover:rotate-0 transition-transform duration-700">*</div>
        
        <div className="relative z-10 space-y-4 w-full flex-1">
          <div className="flex items-center gap-2 text-brutal-blue font-black uppercase text-xs tracking-[0.2em] mb-4">
            <Zap className="w-4 h-4 fill-brutal-blue" /> Live Activity
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.8] tracking-tighter italic">Daily <br/>Feed</h1>
          <p className="text-xl font-bold border-l-4 border-brutal-blue pl-4 mt-8 max-w-md">The heartbeat of the campus network. Stay informed, stay connected.</p>
        </div>
        
        <div className="relative z-10 w-full sm:w-auto flex flex-col gap-4">
           <button 
             onClick={handleCreatePost}
             className="bg-white text-black px-8 py-4 font-black uppercase text-lg border-2 border-black shadow-[4px_4px_0_0_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
           >
             <Plus className="w-5 h-5" />
             New Post
           </button>
          <button 
            onClick={handleOpenFeedSettings}
            className="bg-transparent text-white px-8 py-4 font-black uppercase text-xs border-2 border-white/20 hover:border-white transition-all flex items-center justify-center gap-2">
             <Info className="w-4 h-4"/> Feed Settings
           </button>
           <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
             {feedSettings.sortBy === "popular" ? "Popular first" : "Latest first"} · {feedSettings.showClubPosts ? "Club" : ""}{feedSettings.showClubPosts && feedSettings.showGeneralPosts ? " + " : ""}{feedSettings.showGeneralPosts ? "General" : ""}
           </p>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-12 mb-20">
        {feedError ? (
          <div className="bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0_0_#000]">
            <p className="font-black uppercase text-red-600">{feedError}</p>
          </div>
        ) : null}
        {feedPosts.length === 0 ? (
          <div className="bg-white border-4 border-black p-20 text-center shadow-[8px_8px_0_0_#000]">
            <h2 className="text-4xl font-black uppercase mb-4">Radio Silence</h2>
            <p className="font-bold text-gray-500">{feedEmptyMessage}</p>
          </div>
        ) : (
          feedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* Load More */}
      <div className="flex justify-center pt-8">
        <button 
          onClick={handleLoadMore}
          disabled={isLoadingMore || currentPage >= totalPages}
          className="group flex items-center gap-2 font-black uppercase text-2xl hover:text-brutal-blue transition-all"
        >
          {currentPage >= totalPages ? "All posts loaded" : isLoadingMore ? "Loading..." : "Load more posts"} <LayoutDashboard className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <ModalShell
          className="bg-white border-8 border-black shadow-[16px_16px_0_0_#1d2cf3] max-w-2xl w-full max-h-[calc(100vh-3rem)] overflow-y-auto"
          onClose={handleCloseModal}
        >
          <div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Create Post</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-brutal-gray transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={handleSubmitPost} className="space-y-6">
                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                    Club
                  </label>
                  <select
                    value={postForm.clubName}
                    onChange={(e) => setPostForm({ ...postForm, clubName: e.target.value })}
                    className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  >
                    <option value="General">General</option>
                    {joinedClubs.map((club) => (
                      <option key={club.id} value={club.name}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm font-bold text-gray-500">
                    You can post to General or to clubs you&apos;ve already joined.
                  </p>
                </div>

                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                    What&apos;s happening?
                  </label>
                  <textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    rows={4}
                    required
                    placeholder="Share something with the community..."
                    className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3] resize-none"
                  />
                </div>

                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                    Image (Optional)
                  </label>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    capture="environment"
                  />
                  
                  {/* Image preview */}
                  {imagePreview && (
                    <div className="mb-4 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-64 object-cover border-4 border-black"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        aria-label="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload buttons */}
                  {!imagePreview && (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        className="flex-1 bg-white text-black px-6 py-3 font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.setAttribute('capture', 'environment');
                            fileInputRef.current.click();
                          }
                        }}
                        className="flex-1 bg-white text-black px-6 py-3 font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Take Photo
                      </button>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {imageError && (
                    <p className="text-red-500 font-bold text-sm mt-2 border-l-4 border-red-500 pl-2">
                      {imageError}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmittingPost}
                    className="flex-1 bg-black text-white px-8 py-4 font-black uppercase text-lg border-4 border-black shadow-[6px_6px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                  >
                    {isSubmittingPost ? "Posting..." : "Post"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-white text-black px-8 py-4 font-black uppercase text-lg border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                  >
                    Cancel
                  </button>
                </div>
                {postSubmitError ? (
                  <p className="text-red-600 font-bold text-sm border-l-4 border-red-600 pl-3">
                    {postSubmitError}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </ModalShell>
      )}
      {/* Feed Settings Modal */}
      {showFeedSettings && (
        <ModalShell
          className="bg-white border-8 border-black shadow-[16px_16px_0_0_#1d2cf3] max-w-lg w-full max-h-[calc(100vh-3rem)] overflow-y-auto"
          onClose={handleCloseFeedSettings}
        >
          <div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Feed Settings</h2>
                <button
                  onClick={handleCloseFeedSettings}
                  className="p-2 hover:bg-brutal-gray transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-4 block">
                    Sort Posts By
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sortBy"
                        value="latest"
                        checked={draftFeedSettings.sortBy === "latest"}
                        onChange={(e) => setDraftFeedSettings({ ...draftFeedSettings, sortBy: e.target.value as "latest" | "popular" })}
                        className="w-5 h-5"
                      />
                      <span className="font-bold text-lg">Latest Posts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sortBy"
                        value="popular"
                        checked={draftFeedSettings.sortBy === "popular"}
                        onChange={(e) => setDraftFeedSettings({ ...draftFeedSettings, sortBy: e.target.value as "latest" | "popular" })}
                        className="w-5 h-5"
                      />
                      <span className="font-bold text-lg">Popular Posts</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-4 block">
                    Show Posts From
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftFeedSettings.showClubPosts}
                        onChange={(e) => handleFeedFilterToggle("showClubPosts", e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="font-bold text-lg">Club Posts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftFeedSettings.showGeneralPosts}
                        onChange={(e) => handleFeedFilterToggle("showGeneralPosts", e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="font-bold text-lg">General Posts</span>
                    </label>
                  </div>
                  <p className="mt-3 text-sm font-bold text-gray-500">
                    At least one post type stays enabled so your feed never lands in a dead state.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleApplyFeedSettings}
                    disabled={isApplyingFeedSettings}
                    className="w-full bg-black text-white px-8 py-4 font-black uppercase text-lg border-4 border-black shadow-[6px_6px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0_0_#1d2cf3]"
                  >
                    {isApplyingFeedSettings ? "Applying..." : "Apply Settings"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
