"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, ArrowBigUp, Share2, Calendar } from "lucide-react";
import { type Post } from "@/lib/dataProvider";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/ImageWithFallback";
import { getPostByIdFromApi } from "@/lib/postApi";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { user, isLoggedIn, posts } = useUser();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [comments, setComments] = useState<{ id: string; author: string; content: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postId, setPostId] = useState<string>("");
  const [post, setPost] = useState<Post | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const localPost = useMemo(() => posts.find((item) => item.id === postId) || null, [postId, posts]);
  const resolvedPost = post || localPost;
  const resolvedLikesCount = post ? likesCount : localPost?.likes || likesCount;

  useEffect(() => {
    params.then(({ id }) => {
      setPostId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!postId) return;

    let isActive = true;
    const loadPost = async () => {
      try {
        const fetched = await getPostByIdFromApi(postId);
        if (!isActive || !fetched) return;
        setPost(fetched);
        setLikesCount(fetched.likes);
      } catch {
        // Keep the local fallback if the API is unavailable.
      }
    };

    loadPost();

    return () => {
      isActive = false;
    };
  }, [postId]);

  const redirectToLogin = useCallback(() => {
    router.push(`/login?next=${encodeURIComponent(postId ? `/post/${postId}` : "/feed")}`);
  }, [postId, router]);

  const toggleLike = useCallback(() => {
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
  }, [liked, isLoggedIn, redirectToLogin]);

  const copyToClipboard = useCallback(async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "true");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  }, []);

  const sharePost = useCallback(async () => {
    if (!resolvedPost) return;

    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    const postUrl = `${window.location.origin}/post/${postId}`;
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1600);

    try {
      if (navigator.share) {
        void navigator.share({
          title: `${resolvedPost.clubName} on OCC`,
          text: resolvedPost.content,
          url: postUrl,
        }).catch(() => {});
        return;
      }

      await copyToClipboard(postUrl);
    } catch {
      setShareCopied(false);
    }
  }, [copyToClipboard, isLoggedIn, postId, redirectToLogin, resolvedPost]);

  const handleAddComment = useCallback(() => {
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }
    if (!newComment.trim() || !user) return;

    const comment = {
      id: Date.now().toString(),
      author: user.name,
      content: newComment.trim(),
    };

    setComments([...comments, comment]);
    setNewComment("");
  }, [comments, isLoggedIn, newComment, redirectToLogin, user]);

  if (!postId || !resolvedPost) {
    return (
      <div className="min-h-screen bg-brutal-gray flex items-center justify-center">
        <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0_0_#000] text-center">
          <h1 className="text-4xl font-black uppercase mb-4">Loading Post...</h1>
        </div>
      </div>
    );
  }

  const safeClubLogo = resolvedPost.clubLogo || "/globe.svg";
  const safePostImage = resolvedPost.image?.trim() || null;

  return (
    <div className="min-h-screen bg-brutal-gray">
      <div className="bg-white text-black p-12 md:p-24 border-b-8 border-black relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-brutal-blue opacity-5 -skew-x-12 translate-x-1/2"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-brutal-blue font-black uppercase tracking-widest mb-6 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Feed
          </Link>

          <div className="flex items-center gap-4 text-brutal-blue font-black uppercase tracking-widest mb-6">
            <MessageSquare className="w-6 h-6" /> Post Details
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.85] tracking-tighter mb-8">
            Post Discussion
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="relative isolate bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] mb-12">
          <div className="flex justify-between items-center mb-6">
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  redirectToLogin();
                  return;
                }
                router.push(`/clubs/${resolvedPost.clubId}`);
              }}
              className="flex items-center gap-3 hover:translate-x-1 transition-transform text-left"
            >
              <div className="w-12 h-12 overflow-hidden rounded-xl border-2 border-black bg-white">
                <ImageWithFallback src={safeClubLogo} fallbackSrc="/globe.svg" alt={resolvedPost.clubName} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="bg-black text-white text-sm font-black uppercase px-3 py-1 shadow-[2px_2px_0_0_#1d2cf3] inline-block mb-1">{resolvedPost.clubName}</span>
                <span className="text-xs font-black uppercase text-gray-400">posted by {resolvedPost.author}</span>
              </div>
            </button>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-black uppercase">{resolvedPost.timestamp}</span>
            </div>
          </div>

          <div className="space-y-6 bg-white">
            <p className="text-2xl md:text-3xl font-black uppercase leading-tight text-black border-l-4 border-brutal-blue pl-6 py-2">{resolvedPost.content}</p>
            {safePostImage ? (
              <div className="border-4 border-black bg-[#eef3ff] shadow-[6px_6px_0_0_#000] aspect-[4/3] overflow-hidden">
                <ImageWithFallback src={safePostImage} fallbackSrc="/window.svg" hideOnError alt="Post visual" className="w-full h-full object-contain p-4" />
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-6 bg-white pt-8 mt-6 border-t-4 border-dashed border-gray-300">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 font-black uppercase text-lg px-6 py-3 border-4 border-black transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${liked ? "bg-brutal-blue text-white" : "bg-white text-black"}`}
            >
              <ArrowBigUp className={`w-6 h-6 ${liked ? "fill-white" : ""}`} /> {resolvedLikesCount}
            </button>

            <button
              onClick={sharePost}
              className="flex items-center gap-2 font-black uppercase text-lg px-6 py-3 border-4 border-black transition-all bg-brutal-gray text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 hover:bg-brutal-blue hover:text-white"
            >
              <Share2 className="w-6 h-6" /> {shareCopied ? "Copied" : "Share"}
            </button>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000]">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-4">
            Discussion ({comments.length})
          </h2>

          <div className="mb-8 p-6 bg-brutal-gray border-4 border-black">
            <h3 className="font-black uppercase text-sm text-gray-600 tracking-widest mb-4">Add Your Comment</h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                className="flex-1 bg-white border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3] transition-all"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-black text-white px-8 py-4 font-black uppercase border-4 border-black hover:bg-brutal-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
              >
                Post
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="font-bold text-gray-400 italic text-center py-12">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-brutal-gray border-4 border-black p-6 shadow-[4px_4px_0_0_#000]">
                  <span className="font-black text-sm uppercase text-brutal-blue block mb-2">{comment.author}</span>
                  <p className="font-bold text-lg text-black">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

