"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCircle, Settings, Mail, Calendar, User, BookOpen, LogOut, X, Users, TrendingUp, Calendar as CalendarIcon, Phone, Sparkles, Upload, ImagePlus, Trash2 } from "lucide-react";
import { type ClubMembership, type ActivityStats } from "@/lib/dataProvider";
import { useUser } from "@/context/UserContext";
import PostCard from "@/components/PostCard";
import ModalShell from "@/components/ModalShell";
import ImageWithFallback from "@/components/ImageWithFallback";
import { fetchCurrentProfile } from "@/lib/authApi";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, isLoggedIn, isAuthLoading, posts, getMembershipItems, leaveClub } = useUser();
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmLeaveClub, setConfirmLeaveClub] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<Partial<typeof user>>({});
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [activityStats, setActivityStats] = useState<ActivityStats>({ postsCreated: 0, clubsJoined: 0, eventsAttended: 0 });
  const [profileImageError, setProfileImageError] = useState("");
  const profileImageSrc = user?.profilePicture?.trim() || null;
  const editProfileImageSrc = editForm?.profilePicture?.trim() || null;
  const userPosts = useMemo(
    () => posts.filter(post => post.author === user?.name),
    [posts, user?.name],
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isAuthLoading, isLoggedIn, router]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isLoggedIn) {
      setMemberships([]);
      setIsProfileLoading(false);
      return;
    }

    let isActive = true;

    const loadProfile = async () => {
      setIsProfileLoading(true);
      try {
        const profile = await fetchCurrentProfile();
        if (!isActive) return;
        setMemberships(profile.memberships);
      } catch {
        if (!isActive) return;
        setMemberships(getMembershipItems());
      } finally {
        if (isActive) {
          setIsProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [getMembershipItems, isAuthLoading, isLoggedIn]);

  useEffect(() => {
    setActivityStats({
      postsCreated: userPosts.length,
      clubsJoined: memberships.length,
      eventsAttended: Math.max(0, Math.floor(memberships.length * 1.5)),
    });
  }, [memberships.length, userPosts.length]);

  const handleEditProfile = useCallback(() => {
    if (user) {
      setEditForm({
        name: user.name,
        university: user.university,
        phoneNumber: user.phoneNumber,
        hobbies: user.hobbies,
        profilePicture: user.profilePicture,
      });
      setProfileImageError("");
      setIsEditModalOpen(true);
    }
  }, [user]);

  const handleSaveProfile = useCallback(() => {
    if (editForm && Object.keys(editForm).length > 0) {
      updateUser(editForm);
      setIsEditModalOpen(false);
    }
  }, [editForm, updateUser]);

  const handleLeaveClub = useCallback(async (clubId: string) => {
    const left = await leaveClub(clubId);
    if (!left) return;
    setMemberships((prev) => prev.filter((club) => club.id !== clubId));
    setConfirmLeaveClub(null);
  }, [leaveClub]);

  const handleClubClick = useCallback((clubId: string) => {
    router.push(`/clubs/${clubId}`);
  }, [router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const handleSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const loadProfileImage = useCallback((file: File, onComplete: (value: string) => void) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setProfileImageError("Please choose a PNG, JPG, JPEG, WEBP, or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileImageError("Profile image must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onComplete(reader.result as string);
      setProfileImageError("");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleProfilePictureUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    loadProfileImage(file, (value) => {
      updateUser({ profilePicture: value });
      setEditForm((prev) => ({ ...prev, profilePicture: value }));
    });
  }, [loadProfileImage, updateUser]);

  const handleEditProfilePictureUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    loadProfileImage(file, (value) => {
      setEditForm((prev) => ({ ...prev, profilePicture: value }));
    });
  }, [loadProfileImage]);

  const handleRemoveProfilePicture = useCallback(() => {
    updateUser({ profilePicture: undefined });
  }, [updateUser]);

  const handleRemoveEditProfilePicture = useCallback(() => {
    setEditForm((prev) => ({ ...prev, profilePicture: undefined }));
    setProfileImageError("");
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = "";
    }
  }, []);

  const memberSinceLabel = user?.createdAt
    ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(user.createdAt))
    : "Recently joined";

  return (
    <div className="min-h-screen bg-brutal-gray">
      {isAuthLoading || isProfileLoading || !isLoggedIn || !user ? (
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-20">
          <div className="bg-white border-4 border-black px-10 py-8 shadow-[8px_8px_0_0_#000]">
            <p className="text-2xl font-black uppercase tracking-tight">Loading profile...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="bg-white text-black p-12 md:p-24 border-b-8 border-black relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-brutal-blue opacity-5 -skew-x-12 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 text-brutal-blue font-black uppercase tracking-widest mb-6">
            <UserCircle className="w-6 h-6" /> User Profile
          </div>
          
          {/* Profile Header with Avatar */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-12">
            {/* Avatar */}
            <div className="relative group">
              <div 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-brutal-blue border-8 border-black shadow-[8px_8px_0_0_#000] flex items-center justify-center flex-shrink-0 overflow-hidden"
                aria-label="User profile picture"
              >
                {profileImageSrc ? (
                  <img 
                    src={profileImageSrc} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl md:text-5xl font-black text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Upload/Remove Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Upload profile picture"
                />
                {profileImageSrc ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveProfilePicture();
                    }}
                    className="text-white font-black uppercase text-xs z-10 pointer-events-auto"
                  >
                    Remove
                  </button>
                ) : (
                  <span className="text-white font-black uppercase text-xs pointer-events-none">
                    Add Photo
                  </span>
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-4">
                {user.name}
              </h1>
              <p className="text-2xl md:text-3xl font-black text-brutal-blue mb-3">
                {user.university}
              </p>
              <p className="text-lg md:text-xl font-bold text-gray-700 max-w-2xl">
                Student exploring off-campus communities and building networks.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
            <p className="text-2xl font-black max-w-xl border-l-8 border-black pl-8 bg-brutal-gray p-6 shadow-[6px_6px_0_0_#000]">
              Manage your account, preferences, and club memberships.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleEditProfile}
                className="bg-black text-white px-8 py-4 font-black uppercase text-lg border-4 border-black shadow-[6px_6px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
              >
                <Settings className="w-5 h-5" /> Edit Profile
              </button>
              <button 
                onClick={handleSettings}
                className="bg-white text-black px-8 py-4 font-black uppercase text-lg border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
              >
                <Settings className="w-5 h-5" /> Settings
              </button>
              <button 
                onClick={handleLogout}
                className="bg-brutal-blue text-white px-8 py-4 font-black uppercase text-lg border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-2 xl:items-start">
          {/* Profile Info Card */}
          <div className="min-w-0 h-full bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 border-b-4 border-black pb-4">
              Account Details
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="min-w-0 flex items-start gap-4">
                <User className="w-6 h-6 mt-1" />
                <div className="min-w-0">
                  <p className="font-black uppercase text-sm text-gray-500 tracking-widest">Display Name</p>
                  <p className="font-bold text-xl break-words">{user.name}</p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-4">
                <Mail className="w-6 h-6 mt-1" />
                <div className="min-w-0">
                  <p className="font-black uppercase text-sm text-gray-500 tracking-widest">Email</p>
                  <p className="font-bold text-xl break-words">{user.email}</p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-4">
                <BookOpen className="w-6 h-6 mt-1" />
                <div className="min-w-0">
                  <p className="font-black uppercase text-sm text-gray-500 tracking-widest">College</p>
                  <p className="font-bold text-xl break-words">{user.university || "Not added yet"}</p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-4">
                <Phone className="w-6 h-6 mt-1" />
                <div className="min-w-0">
                  <p className="font-black uppercase text-sm text-gray-500 tracking-widest">Phone Number</p>
                  <p className="font-bold text-xl break-words">{user.phoneNumber || "Not added yet"}</p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-4 sm:col-span-2">
                <Sparkles className="w-6 h-6 mt-1" />
                <div className="min-w-0">
                  <p className="font-black uppercase text-sm text-gray-500 tracking-widest">Hobbies</p>
                  <p className="font-bold text-xl break-words">{user.hobbies || "Tell people what you're into"}</p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-4 sm:col-span-2">
                <Calendar className="w-6 h-6 mt-1" />
                <div className="min-w-0">
                  <p className="font-black uppercase text-sm text-gray-500 tracking-widest">Member Since</p>
                  <p className="font-bold text-xl break-words">{memberSinceLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Club Memberships Card */}
          <div className="min-w-0 h-full bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 border-b-4 border-black pb-4">
              Club Memberships
            </h2>
            {memberships.length > 0 ? (
              <div className="space-y-4">
                {memberships.map(club => (
                  <div 
                    key={club.id}
                    className="border-4 border-black p-4 bg-white transition-colors"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <button
                        onClick={() => handleClubClick(club.slug || club.id)}
                        className="flex min-w-0 items-center gap-4 flex-1 text-left hover:opacity-80 transition-opacity"
                        aria-label={`View ${club.name}`}
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[1.25rem] border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
                          <ImageWithFallback
                            src={club.logo}
                            fallbackSrc="/globe.svg"
                            alt={club.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-lg uppercase break-words">{club.name}</p>
                          <p className="mt-1 font-bold text-sm text-gray-600 line-clamp-2 break-words">
                            {club.description || "Off-campus club membership in your student network."}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="border-2 border-black bg-black px-2 py-1 text-xs font-black uppercase text-white">
                              {club.role}
                            </span>
                            {club.category ? (
                              <span className="border-2 border-black bg-brutal-gray px-2 py-1 text-xs font-black uppercase text-black">
                                {club.category}
                              </span>
                            ) : null}
                            {club.university ? (
                              <span className="border-2 border-black bg-brutal-gray px-2 py-1 text-xs font-black uppercase text-black">
                                {club.university}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setConfirmLeaveClub(club.id)}
                        className="bg-white text-black px-4 py-2 font-black uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-all"
                        aria-label={`Leave ${club.name}`}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="font-bold text-gray-500 text-lg">
                  You haven't joined any clubs yet.
                </p>
              </div>
            )}
          </div>
        </div>

      {/* Activity Stats Section */}
        <div className="mt-12 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000]">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 border-b-4 border-black pb-4">
            Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-brutal-gray border-4 border-black">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <p className="text-5xl font-black mb-2">{activityStats.postsCreated}</p>
              <p className="font-black uppercase text-sm text-gray-600 tracking-widest">Posts Created</p>
            </div>
            <div className="text-center p-6 bg-brutal-gray border-4 border-black">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p className="text-5xl font-black mb-2">{activityStats.clubsJoined}</p>
              <p className="font-black uppercase text-sm text-gray-600 tracking-widest">Clubs Joined</p>
            </div>
            <div className="text-center p-6 bg-brutal-gray border-4 border-black">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4" />
              <p className="text-5xl font-black mb-2">{activityStats.eventsAttended}</p>
              <p className="font-black uppercase text-sm text-gray-600 tracking-widest">Events Attended</p>
            </div>
          </div>
        </div>

      {/* My Posts Section */}
        <div className="mt-12 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000]">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 border-b-4 border-black pb-4">
            My Posts
          </h2>
          {userPosts.length > 0 ? (
            <div className="space-y-6">
              {userPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-bold text-gray-500 text-lg mb-4">
                You haven't posted anything yet.
              </p>
              <Link 
                href="/feed"
                className="bg-black text-white px-6 py-3 font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                Create Your First Post
              </Link>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <ModalShell
          className="bg-white border-8 border-black shadow-[16px_16px_0_0_#1d2cf3] max-w-2xl w-full max-h-[calc(100vh-3rem)] overflow-y-auto"
          onClose={() => setIsEditModalOpen(false)}
        >
          <div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Edit Profile</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-brutal-gray transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                    Profile Photo
                  </label>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleEditProfilePictureUpload}
                    className="hidden"
                  />
                  {editProfileImageSrc ? (
                    <div className="border-4 border-black p-4 bg-brutal-gray">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <img
                          src={editProfileImageSrc}
                          alt="Profile preview"
                          className="w-24 h-24 object-cover rounded-full border-4 border-black bg-white"
                        />
                        <div className="flex-1 space-y-3">
                          <p className="font-bold text-sm text-gray-600">Previewing your profile photo.</p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => profileImageInputRef.current?.click()}
                              className="bg-white text-black px-4 py-2 font-black uppercase text-sm border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
                            >
                              <ImagePlus className="w-4 h-4" />
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveEditProfilePicture}
                              className="bg-white text-black px-4 py-2 font-black uppercase text-sm border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => profileImageInputRef.current?.click()}
                      className="w-full bg-white text-black px-6 py-4 font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Profile Photo
                    </button>
                  )}
                  {profileImageError ? (
                    <p className="mt-3 text-sm font-bold text-red-600">{profileImageError}</p>
                  ) : (
                    <p className="mt-3 text-sm font-bold text-gray-500">Optional. Add a clear profile image from your device.</p>
                  )}
                </div>

                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm?.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  />
                </div>

                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                    University
                  </label>
                  <input
                    type="text"
                    value={editForm?.university || ""}
                    onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                    className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  />
                </div>

                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm?.phoneNumber || ""}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  />
                </div>

                <div>
                  <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
                    Hobbies
                  </label>
                  <input
                    type="text"
                    value={editForm?.hobbies || ""}
                    onChange={(e) => setEditForm({ ...editForm, hobbies: e.target.value })}
                    placeholder="Photography, football, design..."
                    className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-black text-white px-8 py-4 font-black uppercase text-lg border-4 border-black shadow-[6px_6px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-white text-black px-8 py-4 font-black uppercase text-lg border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Leave Club Confirmation Modal */}
      {confirmLeaveClub && (
        <ModalShell
          className="bg-white border-8 border-black shadow-[16px_16px_0_0_#1d2cf3] max-w-md w-full max-h-[calc(100vh-3rem)] overflow-y-auto"
          onClose={() => setConfirmLeaveClub(null)}
        >
          <div>
            <div className="p-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Leave Club?</h2>
              <p className="font-bold text-lg mb-8">
                Are you sure you want to leave {memberships.find(c => c.id === confirmLeaveClub)?.name}?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleLeaveClub(confirmLeaveClub)}
                  className="flex-1 bg-black text-white px-6 py-3 font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#1d2cf3] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  Leave
                </button>
                <button
                  onClick={() => setConfirmLeaveClub(null)}
                  className="flex-1 bg-white text-black px-6 py-3 font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
