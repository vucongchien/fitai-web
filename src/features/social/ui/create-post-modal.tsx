"use client";

import { Globe, ImagePlus, Loader2, Users, X } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";

import { Button } from "@/shared/ui/button";

import type { FeedItemVM } from "../model/social.types";
import { createPostAction } from "../server/social-actions";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newItem: FeedItemVM) => void;
  userAvatarUrl?: string;
  userName?: string;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  userAvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  userName = "You",
}: CreatePostModalProps) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FOLLOWERS_ONLY">("PUBLIC");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleAddMedia = () => {
    if (!mediaUrlInput.trim()) return;
    try {
      new URL(mediaUrlInput.trim());
      setMediaUrls((prev) => [...prev, mediaUrlInput.trim()]);
      setMediaUrlInput("");
      setShowMediaInput(false);
    } catch {
      setErrorMsg("Please enter a valid image URL");
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = () => {
    if (!caption.trim() && mediaUrls.length === 0) {
      setErrorMsg("Please write something or attach an image.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await createPostAction({
        caption: caption.trim(),
        mediaUrls,
        visibility,
      });

      if (res.success && res.item) {
        onPostCreated(res.item);
        setCaption("");
        setMediaUrls([]);
        onClose();
      } else {
        setErrorMsg(res.message || "Failed to publish post.");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 overflow-hidden text-neutral-900 transition-all scale-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
          <h2 id="create-post-title" className="text-base font-bold text-neutral-900">
            Create Post
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info Bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-neutral-200 bg-neutral-100 flex-shrink-0">
            <Image src={userAvatarUrl} alt={userName} fill sizes="40px" className="object-cover" />
          </div>
          <div>
            <span className="text-sm font-semibold text-neutral-900 block leading-tight">
              {userName}
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setVisibility((prev) => (prev === "PUBLIC" ? "FOLLOWERS_ONLY" : "PUBLIC"))
                }
                className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                {visibility === "PUBLIC" ? (
                  <>
                    <Globe size={11} />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Users size={11} />
                    <span>Followers only</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Post Text Input */}
        <div className="mt-3.5">
          <textarea
            autoFocus
            rows={4}
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Share your training journey, questions, or achievements..."
            maxLength={1000}
            className="w-full resize-none border-0 p-1 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-0"
          />
        </div>

        {/* Media Preview */}
        {mediaUrls.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-xl p-1 bg-neutral-50 border border-neutral-100">
            {mediaUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative h-28 w-full rounded-lg overflow-hidden border border-neutral-200 group"
              >
                <Image
                  src={url}
                  alt={`Attachment ${idx + 1}`}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(idx)}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Media URL Input Box */}
        {showMediaInput && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="url"
              placeholder="Paste image URL (https://...)"
              value={mediaUrlInput}
              onChange={(e) => setMediaUrlInput(e.target.value)}
              className="flex-1 rounded-xl border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMedia();
                }
              }}
            />
            <Button size="medium" variant="secondary" onClick={handleAddMedia}>
              Add
            </Button>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Toolbar & Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
          <div className="flex items-center gap-1 text-neutral-500">
            <button
              type="button"
              onClick={() => setShowMediaInput((prev) => !prev)}
              aria-label="Add image"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <ImagePlus size={16} className="text-neutral-500" />
              <span>Image</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-400">{caption.length}/1000</span>
            <Button
              type="button"
              size="medium"
              variant="primary"
              disabled={isPending || (!caption.trim() && mediaUrls.length === 0)}
              onClick={handleCreatePost}
              className="min-w-20"
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin mr-1.5" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
