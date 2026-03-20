"use client";

import type { ChangeEvent, RefObject } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";

type ClubImageUploadFieldProps = {
  accept: string;
  buttonLabel: string;
  description: string;
  emptyLabel: string;
  error?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  label: string;
  onOpenPicker: () => void;
  onRemove: () => void;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  previewAlt: string;
  previewUrl?: string;
  variant?: "banner" | "logo";
};

export default function ClubImageUploadField({
  accept,
  buttonLabel,
  description,
  emptyLabel,
  error,
  inputRef,
  label,
  onOpenPicker,
  onRemove,
  onSelect,
  previewAlt,
  previewUrl,
  variant = "banner",
}: ClubImageUploadFieldProps) {
  const isBanner = variant === "banner";

  return (
    <div>
      <label className="font-black uppercase text-sm text-gray-600 tracking-widest mb-2 block">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onSelect}
        className="hidden"
      />
      {previewUrl ? (
        <div className="border-4 border-black bg-[#f1f2f5] p-4 shadow-[4px_4px_0_0_#000]">
          <div className={`overflow-hidden border-3 border-black bg-white ${isBanner ? "aspect-[16/6] rounded-[1.5rem]" : "h-28 w-28 rounded-[1.5rem]"}`}>
            <img
              src={previewUrl}
              alt={previewAlt}
              className={`h-full w-full ${isBanner ? "object-cover" : "object-cover"}`}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenPicker}
              className="bg-white text-black px-4 py-2 font-black uppercase text-sm border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
            >
              <ImagePlus className="w-4 h-4" />
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="bg-white text-black px-4 py-2 font-black uppercase text-sm border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenPicker}
          className={`w-full border-4 border-dashed border-black bg-white text-black transition-all shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${isBanner ? "rounded-[1.75rem] px-6 py-8" : "px-6 py-4"}`}
        >
          <span className={`flex items-center justify-center gap-2 font-black uppercase text-sm ${isBanner ? "mb-3" : ""}`}>
            <Upload className="w-4 h-4" />
            {buttonLabel}
          </span>
          {isBanner ? (
            <span className="block text-sm font-bold text-gray-500">{emptyLabel}</span>
          ) : null}
        </button>
      )}
      {error ? (
        <p className="mt-3 text-sm font-bold text-red-600">{error}</p>
      ) : (
        <p className="mt-3 text-sm font-bold text-gray-500">{description}</p>
      )}
    </div>
  );
}
