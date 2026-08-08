/**
 * Phân tích và nhận diện nguồn video: YouTube vs Direct MP4/WebM
 */

export interface ParsedVideoSource {
  type: "youtube" | "direct" | "unknown";
  embedUrl?: string;
  directUrl?: string;
  videoId?: string;
}

/**
 * Phân tích URL video để xác định xem là link YouTube hay file video trực tiếp.
 * Hỗ trợ các định dạng:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Direct files: .mp4, .webm, .mov, .m4v, S3/CDN URLs
 */
export function parseVideoSource(url?: string | null): ParsedVideoSource {
  if (!url || typeof url !== "string" || !url.trim()) {
    return { type: "unknown" };
  }

  const cleanUrl = url.trim();

  // Pattern nhận diện YouTube
  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/,
  );

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0`,
    };
  }

  // Link video trực tiếp hoặc CDN
  return {
    type: "direct",
    directUrl: cleanUrl,
  };
}
