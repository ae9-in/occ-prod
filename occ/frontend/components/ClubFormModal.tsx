"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Plus, Save, X } from "lucide-react";
import ClubImageUploadField from "@/components/ClubImageUploadField";
import ModalShell from "@/components/ModalShell";
import {
  CLUB_IMAGE_ACCEPT,
  CLUB_IMAGE_MAX_BYTES,
  CLUB_IMAGE_TYPES,
  type ClubUpsertInput,
} from "@/lib/clubApi";

type ClubFormModalProps = {
  initialValues?: Partial<ClubUpsertInput> & {
    logoPreview?: string;
    bannerPreview?: string;
  };
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (values: ClubUpsertInput & { logoPreview?: string; bannerPreview?: string }) => Promise<void> | void;
};

const DEFAULT_VALUES: ClubUpsertInput = {
  name: "",
  description: "",
  category: "Creative",
  university: "",
  location: "",
  logoFile: null,
  bannerFile: null,
  removeLogo: false,
  removeBanner: false,
};

function validateImageFile(file: File) {
  if (!CLUB_IMAGE_TYPES.includes(file.type as (typeof CLUB_IMAGE_TYPES)[number])) {
    return "Please choose a PNG, JPG, JPEG, WEBP, or GIF image.";
  }

  if (file.size > CLUB_IMAGE_MAX_BYTES) {
    return "Images must be under 5MB.";
  }

  return "";
}

export default function ClubFormModal({
  initialValues,
  isSubmitting = false,
  mode,
  onClose,
  onSubmit,
}: ClubFormModalProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ClubUpsertInput>({ ...DEFAULT_VALUES, ...initialValues });
  const [logoPreview, setLogoPreview] = useState(initialValues?.logoPreview || "");
  const [bannerPreview, setBannerPreview] = useState(initialValues?.bannerPreview || "");
  const [logoError, setLogoError] = useState("");
  const [bannerError, setBannerError] = useState("");

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview, logoPreview]);

  const replacePreview = (
    nextFile: File,
    previousPreview: string,
    setPreview: (preview: string) => void,
  ) => {
    if (previousPreview.startsWith("blob:")) {
      URL.revokeObjectURL(previousPreview);
    }
    setPreview(URL.createObjectURL(nextFile));
  };

  const handleImagePick = (kind: "logo" | "banner") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationMessage = validateImageFile(file);
    if (validationMessage) {
      if (kind === "logo") {
        setLogoError(validationMessage);
      } else {
        setBannerError(validationMessage);
      }
      return;
    }

    if (kind === "logo") {
      replacePreview(file, logoPreview, setLogoPreview);
      setLogoError("");
      setForm((prev) => ({ ...prev, logoFile: file, removeLogo: false }));
    } else {
      replacePreview(file, bannerPreview, setBannerPreview);
      setBannerError("");
      setForm((prev) => ({ ...prev, bannerFile: file, removeBanner: false }));
    }
  };

  const clearImage = (kind: "logo" | "banner") => {
    if (kind === "logo") {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoPreview("");
      setLogoError("");
      setForm((prev) => ({ ...prev, logoFile: null, removeLogo: true }));
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
      return;
    }

    if (bannerPreview.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }
    setBannerPreview("");
    setBannerError("");
    setForm((prev) => ({ ...prev, bannerFile: null, removeBanner: true }));
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      logoPreview,
      bannerPreview,
    });
  };

  return (
    <ModalShell
      className="w-full max-w-3xl border-8 border-black bg-white shadow-[16px_16px_0_0_#1d2cf3]"
      onClose={onClose}
    >
      <div className="max-h-[calc(100vh-3rem)] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div className="flex items-center justify-between border-b-4 border-black pb-4">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter">
                {mode === "create" ? "Create Club" : "Edit Club"}
              </h2>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
                OCC club identity, refined.
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 transition-colors hover:bg-brutal-gray">
              <X className="h-8 w-8" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block font-black uppercase text-sm tracking-widest text-gray-600">Club Name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  placeholder="Creative Builders Guild"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block font-black uppercase text-sm tracking-widest text-gray-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full resize-none border-4 border-black p-4 font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  rows={5}
                  placeholder="What is this club about?"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="border-4 border-black p-4 font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                >
                  <option value="Creative">Creative</option>
                  <option value="Academic">Academic</option>
                  <option value="Sports">Sports</option>
                  <option value="Technology">Technology</option>
                  <option value="Social">Social</option>
                </select>
                <input
                  value={form.university || ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, university: event.target.value }))}
                  className="border-4 border-black p-4 font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  placeholder="University"
                />
                <input
                  value={form.location || ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  className="border-4 border-black p-4 font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#1d2cf3]"
                  placeholder="Location"
                />
              </div>
            </div>

            <div className="space-y-6">
              <ClubImageUploadField
                accept={CLUB_IMAGE_ACCEPT}
                buttonLabel="Upload Club Picture"
                description="Optional. Add a square club logo from your device."
                emptyLabel="Add the mark people will recognize in the club grid."
                error={logoError}
                inputRef={logoInputRef}
                label="Club Logo"
                onOpenPicker={() => logoInputRef.current?.click()}
                onRemove={() => clearImage("logo")}
                onSelect={handleImagePick("logo")}
                previewAlt="Club logo preview"
                previewUrl={logoPreview}
                variant="logo"
              />

              <ClubImageUploadField
                accept={CLUB_IMAGE_ACCEPT}
                buttonLabel="Upload Club Banner"
                description="Optional. Banners appear in the club hero and can be replaced anytime."
                emptyLabel="A wide banner gives the club page a richer hero treatment."
                error={bannerError}
                inputRef={bannerInputRef}
                label="Club Banner"
                onOpenPicker={() => bannerInputRef.current?.click()}
                onRemove={() => clearImage("banner")}
                onSelect={handleImagePick("banner")}
                previewAlt="Club banner preview"
                previewUrl={bannerPreview}
                variant="banner"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-black px-8 py-4 text-lg font-black uppercase text-white shadow-[6px_6px_0_0_#1d2cf3] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : mode === "create" ? <Plus className="h-5 w-5" /> : <Save className="h-5 w-5" />}
              {mode === "create" ? "Create Club" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-4 border-black bg-white px-8 py-4 text-lg font-black uppercase text-black shadow-[6px_6px_0_0_#000] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
