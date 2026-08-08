import { describe, expect, it } from '@jest/globals';


import { parseVideoSource } from "@/features/workout/domain/video-source-parser";

describe("video Source Parser (YouTube vs Direct MP4)", () => {
  it("recognizes standard youtube watch URLs", () => {
    const res = parseVideoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res.type).toBe("youtube");
    expect(res.videoId).toBe("dQw4w9WgXcQ");
    expect(res.embedUrl).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(res.embedUrl).toContain("autoplay=1");
  });

  it("recognizes youtu.be shortened URLs", () => {
    const res = parseVideoSource("https://youtu.be/abc123XYZ45");
    expect(res.type).toBe("youtube");
    expect(res.videoId).toBe("abc123XYZ45");
    expect(res.embedUrl).toContain("https://www.youtube-nocookie.com/embed/abc123XYZ45");
  });

  it("recognizes youtube embed and shorts URLs", () => {
    const resEmbed = parseVideoSource("https://www.youtube.com/embed/short123456");
    expect(resEmbed.type).toBe("youtube");
    expect(resEmbed.videoId).toBe("short123456");

    const resShorts = parseVideoSource("https://www.youtube.com/shorts/short789012");
    expect(resShorts.type).toBe("youtube");
    expect(resShorts.videoId).toBe("short789012");
  });

  it("identifies direct video files (.mp4 / S3 / Cloudinary)", () => {
    const res = parseVideoSource("https://s3.amazonaws.com/gym-companion/squat-demo.mp4");
    expect(res.type).toBe("direct");
    expect(res.directUrl).toBe("https://s3.amazonaws.com/gym-companion/squat-demo.mp4");
  });

  it("handles empty or null video URLs gracefully", () => {
    expect(parseVideoSource(null).type).toBe("unknown");
    expect(parseVideoSource("").type).toBe("unknown");
    expect(parseVideoSource("   ").type).toBe("unknown");
  });
});
