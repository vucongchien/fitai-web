import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const QUERIES_PATH = path.join(__dirname, "seo-geo-aeo-queries.json");
const REPORTS_DIR = path.join(ROOT_DIR, "reports", "seo-geo-aeo");

const AI_BOTS_TO_CHECK = [
  "Googlebot",
  "Bingbot",
  "Google-Extended",
  "OAI-SearchBot",
  "PerplexityBot",
  "Claude-SearchBot",
];

function parseArgs(argv) {
  const args = {
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://fitai.chien204.id.vn",
    gscIndexed: null,
    skipPsi: false,
    skipAi: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--url" && argv[i + 1]) {
      args.url = argv[++i];
    } else if (token === "--gsc-indexed" && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (Number.isFinite(n) && n >= 0) args.gscIndexed = n;
    } else if (token === "--skip-psi") {
      args.skipPsi = true;
    } else if (token === "--skip-ai") {
      args.skipAi = true;
    }
  }

  args.url = args.url.replace(/\/+$/, "");
  return args;
}

async function fetchEndpoint(url, userAgent = "Googlebot/2.1 (+http://www.google.com/bot.html)") {
  const started = Date.now();
  const res = await fetch(url, {
    redirect: "manual",
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml,application/xml,text/plain;q=0.9",
    },
  });
  const ttfbMs = Date.now() - started;
  const body = await res.text();
  return {
    url,
    status: res.status,
    location: res.headers.get("location"),
    contentType: res.headers.get("content-type") || "",
    ttfbMs,
    body,
  };
}

function stripHtmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagContent(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      blocks.push({ valid: true, data: JSON.parse(match[1]) });
    } catch (error) {
      blocks.push({ valid: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return blocks;
}

function isLocalhostUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  } catch {
    return false;
  }
}

async function runPageSpeedAudit(targetUrl) {
  const key = process.env.PAGESPEED_API_KEY?.trim();
  const params = new URLSearchParams({
    url: targetUrl,
    strategy: "mobile",
    category: "SEO",
  });
  params.append("category", "PERFORMANCE");
  if (key) params.set("key", key);

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      reason: `PageSpeed API returned HTTP ${res.status}`,
    };
  }
  const json = await res.json();
  const categories = json.lighthouseResult?.categories || {};
  const audits = json.lighthouseResult?.audits || {};
  return {
    ok: true,
    seoScore: categories.seo?.score != null ? Math.round(categories.seo.score * 100) : null,
    performanceScore:
      categories.performance?.score != null ? Math.round(categories.performance.score * 100) : null,
    lcp: audits["largest-contentful-paint"]?.displayValue || null,
    cls: audits["cumulative-layout-shift"]?.displayValue || null,
    inp: audits["interaction-to-next-paint"]?.displayValue || null,
  };
}

function parseRobotsRules(robotsText) {
  const blocks = robotsText
    .split(/\r?\n\r?\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const botAccess = {};
  for (const bot of AI_BOTS_TO_CHECK) {
    const specific = blocks.find((b) =>
      new RegExp(`^User-agent:\\s*${bot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "im").test(b),
    );
    const wildcard = blocks.find((b) => /^User-agent:\s*\*/im.test(b));
    const chosen = specific || wildcard || "";
    const disallowsRoot = /^Disallow:\s*\/\s*$/im.test(chosen);
    const allowsRoot = /^Allow:\s*\/\s*$/im.test(chosen) || !disallowsRoot;
    botAccess[bot] = {
      hasExplicitRule: Boolean(specific),
      allowedRoot: allowsRoot && !disallowsRoot,
    };
  }
  return botAccess;
}

function validateLlmsTxt(text, domain) {
  const checks = {
    hasH1: /^#\s+\S+/m.test(text),
    hasSummaryQuote: /^>\s+\S+/m.test(text),
    hasSections: /^##\s+\S+/m.test(text),
    hasLinks: /https?:\/\/\S+/.test(text),
    mentionsDomain: text.toLowerCase().includes(domain.toLowerCase()),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    readinessPct: Math.round((passed / Object.keys(checks).length) * 100),
  };
}

function validateAeoSchema(jsonLdBlocks, html) {
  const validBlocks = jsonLdBlocks.filter((b) => b.valid).map((b) => b.data);
  const types = validBlocks.map((d) => d["@type"]).filter(Boolean);
  const hasWebsite = validBlocks.some(
    (d) => d["@type"] === "WebSite" && d["@context"] === "https://schema.org" && d.name && d.url,
  );
  const hasSoftwareApp = validBlocks.some(
    (d) =>
      d["@type"] === "SoftwareApplication" &&
      d["@context"] === "https://schema.org" &&
      d.name &&
      d.applicationCategory &&
      d.operatingSystem,
  );
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;

  const checks = {
    validJsonLdSyntax: jsonLdBlocks.length > 0 && jsonLdBlocks.every((b) => b.valid),
    hasWebsiteSchema: hasWebsite,
    hasSoftwareAppSchema: hasSoftwareApp,
    singleH1: h1Count === 1,
    hasSubheadings: h2Count >= 2,
  };
  const passed = Object.values(checks).filter(Boolean).length;

  return {
    types,
    h1Count,
    h2Count,
    checks,
    readinessPct: Math.round((passed / Object.keys(checks).length) * 100),
  };
}

async function runGeminiSearchBenchmarks(querySet, apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  const domain = querySet.targetDomain.toLowerCase();
  const brandNames = querySet.brandNames.map((b) => b.toLowerCase());

  const aeoResults = [];
  for (const item of querySet.aeoQueries) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: item.prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = (response.text || "").toLowerCase();
    const matchedKeywords = item.expectedKeywords.filter((kw) => text.includes(kw.toLowerCase()));
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citedUrls = chunks.map((c) => c.web?.uri || c.web?.title || "").filter(Boolean);
    const domainCited =
      text.includes(domain) || citedUrls.some((u) => u.toLowerCase().includes(domain));

    aeoResults.push({
      id: item.id,
      accurate: matchedKeywords.length >= Math.ceil(item.expectedKeywords.length / 2),
      matchedKeywords,
      domainCited,
      citedCount: citedUrls.length,
    });
  }

  const geoResults = [];
  for (const item of querySet.geoQueries) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: item.prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const rawText = response.text || "";
    const text = rawText.toLowerCase();
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citedSources = chunks.map((c) => ({
      title: c.web?.title || "",
      uri: c.web?.uri || "",
      domain: c.web?.domain || "",
    }));

    const brandIdx = brandNames.reduce((best, b) => {
      const idx = text.indexOf(b);
      if (idx === -1) return best;
      return best === -1 ? idx : Math.min(best, idx);
    }, -1);

    const mentioned = brandIdx !== -1;
    const earlyMention = mentioned && rawText.length > 0 && brandIdx / rawText.length <= 0.5;
    const cited =
      text.includes(domain) ||
      citedSources.some(
        (s) =>
          s.title.toLowerCase().includes(domain) ||
          s.uri.toLowerCase().includes(domain) ||
          s.domain.toLowerCase().includes(domain),
      );

    geoResults.push({
      id: item.id,
      category: item.category,
      mentioned,
      earlyMention,
      cited,
      citedCount: citedSources.length,
    });
  }

  const aeoAccuracyPct = Math.round(
    (aeoResults.filter((r) => r.accurate).length / aeoResults.length) * 100,
  );
  const geoMentionPct = Math.round(
    (geoResults.filter((r) => r.mentioned).length / geoResults.length) * 100,
  );
  const geoCitationPct = Math.round(
    (geoResults.filter((r) => r.cited).length / geoResults.length) * 100,
  );

  return {
    provider: "google-gemini-2.5-flash (googleSearch grounding, free tier)",
    aeoAccuracyPct,
    geoMentionPct,
    geoCitationPct,
    aeoResults,
    geoResults,
  };
}

function loadPreviousReport(todayFilename) {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith(".json") && f !== todayFilename)
    .sort();
  if (files.length === 0) return null;
  const prevPath = path.join(REPORTS_DIR, files[files.length - 1]);
  try {
    return {
      filename: files[files.length - 1],
      data: JSON.parse(fs.readFileSync(prevPath, "utf8")),
    };
  } catch {
    return null;
  }
}

function formatDelta(current, prev) {
  if (current == null || prev == null) return "";
  const diff = current - prev;
  if (diff === 0) return " (±0)";
  return diff > 0 ? ` (+${diff})` : ` (${diff})`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const querySet = JSON.parse(fs.readFileSync(QUERIES_PATH, "utf8"));
  const baseUrl = args.url;

  console.log(`\n=== FITAI SEO / AEO / GEO Benchmark ===`);
  console.log(`Target: ${baseUrl}\n`);

  // 1. Live HTTP Crawl (Googlebot User-Agent, no cookies)
  const [homeRes, loginRes, robotsRes, sitemapRes, llmsRes, ogRes] = await Promise.all([
    fetchEndpoint(`${baseUrl}/`),
    fetchEndpoint(`${baseUrl}/login`),
    fetchEndpoint(`${baseUrl}/robots.txt`),
    fetchEndpoint(`${baseUrl}/sitemap.xml`),
    fetchEndpoint(`${baseUrl}/llms.txt`),
    fetchEndpoint(`${baseUrl}/opengraph-image`),
  ]);

  const homeText = stripHtmlToText(homeRes.body);
  const homeWordCount = homeText ? homeText.split(/\s+/).length : 0;
  const homeTitle = extractTagContent(homeRes.body, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const homeDesc = extractTagContent(
    homeRes.body,
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
  );
  const homeCanonical = extractTagContent(
    homeRes.body,
    /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i,
  );
  const homeOgImage = extractTagContent(
    homeRes.body,
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i,
  );
  const loginTitle = extractTagContent(loginRes.body, /<title[^>]*>([\s\S]*?)<\/title>/i);

  const sitemapLocMatches = sitemapRes.body.match(/<loc>([^<]+)<\/loc>/gi) || [];
  const sitemapUrlCount = sitemapLocMatches.length;

  const seoChecks = {
    homeReturns200: homeRes.status === 200,
    loginReturns200: loginRes.status === 200,
    robotsReturns200: robotsRes.status === 200 && /Sitemap:/i.test(robotsRes.body),
    sitemapReturns200: sitemapRes.status === 200 && sitemapUrlCount > 0,
    ogImageReturns200: ogRes.status === 200,
    hasTitleAndDesc: Boolean(homeTitle && homeDesc),
    noDuplicateBrandInLoginTitle: Boolean(loginTitle && !/FITAI\s*·\s*FITAI/i.test(loginTitle)),
    hasCanonicalAndOgImage: Boolean(homeCanonical && homeOgImage),
    ssrWordCountEnough: homeWordCount >= 80,
  };
  const seoTechnicalPct = Math.round(
    (Object.values(seoChecks).filter(Boolean).length / Object.keys(seoChecks).length) * 100,
  );

  // PageSpeed Insights API (optional skip for localhost)
  let psi = { ok: false, reason: "Skipped" };
  if (!args.skipPsi && !isLocalhostUrl(baseUrl)) {
    psi = await runPageSpeedAudit(`${baseUrl}/`);
  } else if (isLocalhostUrl(baseUrl)) {
    psi = { ok: false, reason: "Localhost URL cannot be reached by public PageSpeed API" };
  }

  const indexationRatePct =
    args.gscIndexed != null && sitemapUrlCount > 0
      ? Math.round((args.gscIndexed / sitemapUrlCount) * 100)
      : null;

  // 2. AEO Checks (Schema.org + Semantic Structure)
  const jsonLdBlocks = extractJsonLdBlocks(homeRes.body);
  const aeoSchema = validateAeoSchema(jsonLdBlocks, homeRes.body);

  // 3. GEO Checks (RFC 9309 AI Crawler Access + llmstxt.org)
  const aiBotAccess = parseRobotsRules(robotsRes.body);
  const allowedAiBotsCount = Object.values(aiBotAccess).filter((b) => b.allowedRoot).length;
  const aiCrawlerAccessPct =
    robotsRes.status === 200 ? Math.round((allowedAiBotsCount / AI_BOTS_TO_CHECK.length) * 100) : 0;
  const llmsCheck =
    llmsRes.status === 200
      ? validateLlmsTxt(llmsRes.body, querySet.targetDomain)
      : { checks: {}, readinessPct: 0 };
  const geoReadinessPct = Math.round((aiCrawlerAccessPct + llmsCheck.readinessPct) / 2);

  // Live Gemini Search Grounding (Free Tier) if GEMINI_API_KEY is present
  let aiSearchMetrics = null;
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!args.skipAi && geminiKey) {
    console.log("Running Gemini Google Search Grounding benchmark (Free Tier)...");
    aiSearchMetrics = await runGeminiSearchBenchmarks(querySet, geminiKey);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayFile = `${today}.json`;
  const previous = loadPreviousReport(todayFile);

  const report = {
    timestamp: new Date().toISOString(),
    targetUrl: baseUrl,
    endpoints: {
      "/": { status: homeRes.status, ttfbMs: homeRes.ttfbMs, wordCount: homeWordCount },
      "/login": { status: loginRes.status, ttfbMs: loginRes.ttfbMs, title: loginTitle },
      "/robots.txt": { status: robotsRes.status },
      "/sitemap.xml": { status: sitemapRes.status, urls: sitemapUrlCount },
      "/llms.txt": { status: llmsRes.status },
      "/opengraph-image": { status: ogRes.status },
    },
    metrics: {
      seo: {
        technicalReadinessPct: seoTechnicalPct,
        lighthouseSeoScore: psi.ok ? psi.seoScore : null,
        lighthousePerfScore: psi.ok ? psi.performanceScore : null,
        coreWebVitals: psi.ok ? { lcp: psi.lcp, cls: psi.cls, inp: psi.inp } : null,
        indexationRatePct,
        checks: seoChecks,
        psiNote: psi.ok ? undefined : psi.reason,
      },
      aeo: {
        schemaReadinessPct: aeoSchema.readinessPct,
        answerAccuracyPct: aiSearchMetrics ? aiSearchMetrics.aeoAccuracyPct : null,
        schemaTypes: aeoSchema.types,
        checks: aeoSchema.checks,
      },
      geo: {
        geoReadinessPct,
        aiCrawlerAccessPct,
        llmsTxtReadinessPct: llmsCheck.readinessPct,
        brandMentionRatePct: aiSearchMetrics ? aiSearchMetrics.geoMentionPct : null,
        citationLinkRatePct: aiSearchMetrics ? aiSearchMetrics.geoCitationPct : null,
        aiBotAccess,
        llmsChecks: llmsCheck.checks,
      },
    },
    aiSearchBenchmark: aiSearchMetrics,
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, todayFile);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const prevMetrics = previous?.data?.metrics;

  console.log("3 Core Pillars Summary:");
  console.log(
    `1. [SEO] Technical Readiness: ${seoTechnicalPct}%${formatDelta(seoTechnicalPct, prevMetrics?.seo?.technicalReadinessPct)} | Lighthouse SEO: ${psi.ok ? `${psi.seoScore}/100` : `N/A (${psi.reason})`} | Indexation: ${indexationRatePct != null ? `${indexationRatePct}%` : "Pass --gsc-indexed <count>"}`,
  );
  console.log(
    `2. [AEO] Schema Readiness:    ${aeoSchema.readinessPct}%${formatDelta(aeoSchema.readinessPct, prevMetrics?.aeo?.schemaReadinessPct)} | Gemini Answer Accuracy: ${aiSearchMetrics ? `${aiSearchMetrics.aeoAccuracyPct}%` : "Set GEMINI_API_KEY to measure"}`,
  );
  console.log(
    `3. [GEO] Infra Readiness:     ${geoReadinessPct}%${formatDelta(geoReadinessPct, prevMetrics?.geo?.geoReadinessPct)} | Gemini Brand Mention: ${aiSearchMetrics ? `${aiSearchMetrics.geoMentionPct}%` : "Set GEMINI_API_KEY"} | Citation Link: ${aiSearchMetrics ? `${aiSearchMetrics.geoCitationPct}%` : "Set GEMINI_API_KEY"}`,
  );
  console.log(`\nReport saved: ${path.relative(ROOT_DIR, reportPath)}\n`);
}

main().catch((error) => {
  console.error("[audit:seo] Failed:", error);
  process.exitCode = 1;
});
