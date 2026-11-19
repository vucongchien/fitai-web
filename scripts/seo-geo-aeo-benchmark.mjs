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
    psiKey: process.env.PAGESPEED_API_KEY?.trim() || process.env.GOOGLE_PSI_API_KEY?.trim() || null,
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
    } else if (token === "--psi-key" && argv[i + 1]) {
      args.psiKey = argv[++i];
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

async function runPageSpeedAudit(targetUrl, explicitKey) {
  const key = explicitKey || process.env.PAGESPEED_API_KEY?.trim() || "";
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
    const escaped = bot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const specific = blocks.find((b) => new RegExp(`^User-agent:\\s*${escaped}\\b`, "im").test(b));
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

function collectSchemaTypes(html) {
  const blocks = extractJsonLdBlocks(html);
  const valid = blocks.length > 0 && blocks.every((b) => b.valid);
  const types = blocks
    .filter((b) => b.valid)
    .map((b) => b.data["@type"])
    .filter(Boolean);
  return { valid, types };
}

async function crawlSitemapUrls(baseUrl, sitemapBody) {
  const locs = Array.from(sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/gi)).map((m) => m[1].trim());
  const paths = locs.map((loc) => {
    try {
      return new URL(loc).pathname;
    } catch {
      return "/";
    }
  });
  const results = await Promise.all(
    paths.map(async (routePath) => {
      const res = await fetchEndpoint(`${baseUrl}${routePath}`);
      const text = stripHtmlToText(res.body);
      const wordCount = text ? text.split(/\s+/).length : 0;
      const schema = collectSchemaTypes(res.body);
      const h1Count = (res.body.match(/<h1[\s>]/gi) || []).length;
      const ogMeta = extractTagContent(
        res.body,
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i,
      );
      let ogImagePath = null;
      if (ogMeta) {
        try {
          const parsed = new URL(ogMeta, baseUrl);
          ogImagePath = `${parsed.pathname}${parsed.search}`;
        } catch {
          ogImagePath = null;
        }
      }
      return {
        path: routePath,
        status: res.status,
        wordCount,
        h1Count,
        validJsonLd: schema.valid,
        schemaTypes: schema.types,
        ogImagePath,
      };
    }),
  );
  return results;
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
    aeoResults.push({
      id: item.id,
      accurate: matchedKeywords.length >= Math.ceil(item.expectedKeywords.length / 2),
      matchedKeywords,
      domainCited: text.includes(domain) || citedUrls.some((u) => u.toLowerCase().includes(domain)),
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
    const mentioned = brandNames.some((b) => text.includes(b));
    const cited =
      text.includes(domain) ||
      citedSources.some(
        (s) =>
          s.title.toLowerCase().includes(domain) ||
          s.uri.toLowerCase().includes(domain) ||
          s.domain.toLowerCase().includes(domain),
      );
    geoResults.push({ id: item.id, category: item.category, mentioned, cited });
  }

  return {
    provider: "google-gemini-2.5-flash (googleSearch grounding, free tier)",
    aeoAccuracyPct: Math.round(
      (aeoResults.filter((r) => r.accurate).length / aeoResults.length) * 100,
    ),
    geoMentionPct: Math.round(
      (geoResults.filter((r) => r.mentioned).length / geoResults.length) * 100,
    ),
    geoCitationPct: Math.round(
      (geoResults.filter((r) => r.cited).length / geoResults.length) * 100,
    ),
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
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(REPORTS_DIR, files[files.length - 1]), "utf8"),
    );
    return { filename: files[files.length - 1], data };
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

  const [
    homeRes,
    loginRes,
    robotsRes,
    sitemapRes,
    llmsRes,
    llmsFullRes,
    ogRes,
    feedRes,
    knowledgeRes,
    indexNowRes,
  ] = await Promise.all([
    fetchEndpoint(`${baseUrl}/`),
    fetchEndpoint(`${baseUrl}/login`),
    fetchEndpoint(`${baseUrl}/robots.txt`),
    fetchEndpoint(`${baseUrl}/sitemap.xml`),
    fetchEndpoint(`${baseUrl}/llms.txt`),
    fetchEndpoint(`${baseUrl}/llms-full.txt`),
    fetchEndpoint(`${baseUrl}/opengraph-image`),
    fetchEndpoint(`${baseUrl}/feed.xml`),
    fetchEndpoint(`${baseUrl}/knowledge.json`),
    fetchEndpoint(`${baseUrl}/fitai-indexnow-20261115.txt`),
  ]);

  const sitemapPages =
    sitemapRes.status === 200 ? await crawlSitemapUrls(baseUrl, sitemapRes.body) : [];
  const labPageMeta = sitemapPages.find((p) => p.path === "/lab");
  const guidesPageMeta = sitemapPages.find((p) => p.path === "/guides");
  const [labOgRes, guidesOgRes] = await Promise.all([
    labPageMeta?.ogImagePath
      ? fetchEndpoint(`${baseUrl}${labPageMeta.ogImagePath}`)
      : Promise.resolve({ status: 0 }),
    guidesPageMeta?.ogImagePath
      ? fetchEndpoint(`${baseUrl}${guidesPageMeta.ogImagePath}`)
      : Promise.resolve({ status: 0 }),
  ]);
  const allSitemapReturn200 =
    sitemapPages.length > 0 && sitemapPages.every((p) => p.status === 200 && p.h1Count === 1);

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
  const homeWordCount = stripHtmlToText(homeRes.body).split(/\s+/).filter(Boolean).length;

  let knowledgeValid = false;
  if (knowledgeRes.status === 200) {
    try {
      const parsedKnowledge = JSON.parse(knowledgeRes.body);
      knowledgeValid =
        Array.isArray(parsedKnowledge.exercises) && parsedKnowledge.exercises.length >= 12;
    } catch {
      knowledgeValid = false;
    }
  }

  const seoChecks = {
    homeReturns200: homeRes.status === 200,
    allSitemapUrlsHealthy: allSitemapReturn200,
    robotsReturns200: robotsRes.status === 200 && /Sitemap:/i.test(robotsRes.body),
    sitemapReturns200: sitemapRes.status === 200 && sitemapPages.length > 0,
    ogImageReturns200:
      ogRes.status === 200 && labOgRes.status === 200 && guidesOgRes.status === 200,
    rssFeedHealthy: feedRes.status === 200 && /<rss[\s>]/i.test(feedRes.body),
    indexNowKeyReady:
      indexNowRes.status === 200 && indexNowRes.body.trim() === "fitai-indexnow-20261115",
    hasTitleAndDesc: Boolean(homeTitle && homeDesc),
    noDuplicateBrandInLoginTitle: Boolean(loginTitle && !/FITAI\s*·\s*FITAI/i.test(loginTitle)),
    hasCanonicalAndOgImage: Boolean(homeCanonical && homeOgImage),
    ssrWordCountEnough: homeWordCount >= 80,
  };
  const seoTechnicalPct = Math.round(
    (Object.values(seoChecks).filter(Boolean).length / Object.keys(seoChecks).length) * 100,
  );

  let psi = { ok: false, reason: "Skipped" };
  if (!args.skipPsi && !isLocalhostUrl(baseUrl)) {
    psi = await runPageSpeedAudit(`${baseUrl}/`, args.psiKey);
  } else if (isLocalhostUrl(baseUrl)) {
    psi = { ok: false, reason: "Localhost URL cannot be reached by public PageSpeed API" };
  }

  const indexationRatePct =
    args.gscIndexed != null && sitemapPages.length > 0
      ? Math.round((args.gscIndexed / sitemapPages.length) * 100)
      : null;

  const squatSample = sitemapPages.find((p) => p.path === "/lab/squat");
  const guideSample = sitemapPages.find((p) => p.path === "/guides/4-week-adaptive-roadmap");
  const glossarySample = sitemapPages.find((p) => p.path === "/lab/glossary");
  const homeSchema = collectSchemaTypes(homeRes.body);
  const aeoChecks = {
    homeSchemaValid:
      homeSchema.valid &&
      homeSchema.types.includes("SoftwareApplication") &&
      homeSchema.types.includes("FAQPage"),
    labHowToAndFaqValid: Boolean(
      squatSample?.validJsonLd &&
      squatSample.schemaTypes.includes("HowTo") &&
      squatSample.schemaTypes.includes("FAQPage"),
    ),
    guideArticleAndFaqValid: Boolean(
      guideSample?.validJsonLd &&
      guideSample.schemaTypes.includes("TechArticle") &&
      guideSample.schemaTypes.includes("FAQPage"),
    ),
    glossaryDefinedTermSetValid: Boolean(
      glossarySample?.validJsonLd && glossarySample.schemaTypes.includes("DefinedTermSet"),
    ),
    allContentPagesHaveH1: sitemapPages.length > 0 && sitemapPages.every((p) => p.h1Count === 1),
  };
  const aeoSchemaPct = Math.round(
    (Object.values(aeoChecks).filter(Boolean).length / Object.keys(aeoChecks).length) * 100,
  );

  const aiBotAccess = parseRobotsRules(robotsRes.body);
  const allowedAiBotsCount = Object.values(aiBotAccess).filter((b) => b.allowedRoot).length;
  const aiCrawlerAccessPct =
    robotsRes.status === 200 ? Math.round((allowedAiBotsCount / AI_BOTS_TO_CHECK.length) * 100) : 0;
  const llmsCheck =
    llmsRes.status === 200
      ? validateLlmsTxt(llmsRes.body, querySet.targetDomain)
      : { checks: {}, readinessPct: 0 };
  const llmsFullReady = llmsFullRes.status === 200 && llmsFullRes.body.length > 500 ? 100 : 0;
  const knowledgeJsonReady = knowledgeValid ? 100 : 0;
  const geoReadinessPct = Math.round(
    (aiCrawlerAccessPct + llmsCheck.readinessPct + llmsFullReady + knowledgeJsonReady) / 4,
  );

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
    sitemapUrlCount: sitemapPages.length,
    endpoints: {
      "/": { status: homeRes.status, ttfbMs: homeRes.ttfbMs, wordCount: homeWordCount },
      "/robots.txt": { status: robotsRes.status },
      "/sitemap.xml": { status: sitemapRes.status, urls: sitemapPages.length },
      "/llms.txt": { status: llmsRes.status },
      "/llms-full.txt": { status: llmsFullRes.status },
      "/feed.xml": { status: feedRes.status },
      "/knowledge.json": { status: knowledgeRes.status, valid: knowledgeValid },
      "/fitai-indexnow-20261115.txt": { status: indexNowRes.status },
      "/opengraph-image": { status: ogRes.status },
      "/lab/opengraph-image": { status: labOgRes.status },
      "/guides/opengraph-image": { status: guidesOgRes.status },
    },
    sitemapPages,
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
        schemaReadinessPct: aeoSchemaPct,
        answerAccuracyPct: aiSearchMetrics ? aiSearchMetrics.aeoAccuracyPct : null,
        checks: aeoChecks,
      },
      geo: {
        geoReadinessPct,
        aiCrawlerAccessPct,
        llmsTxtReadinessPct: llmsCheck.readinessPct,
        llmsFullReadyPct: llmsFullReady,
        knowledgeJsonReadyPct: knowledgeJsonReady,
        brandMentionRatePct: aiSearchMetrics ? aiSearchMetrics.geoMentionPct : null,
        citationLinkRatePct: aiSearchMetrics ? aiSearchMetrics.geoCitationPct : null,
        aiBotAccess,
      },
    },
    aiSearchBenchmark: aiSearchMetrics,
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, todayFile);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const prevMetrics = previous?.data?.metrics;
  console.log(`Indexed Sitemap URLs Crawled: ${sitemapPages.length}`);
  console.log("3 Core Pillars Summary:");
  console.log(
    `1. [SEO] Technical Readiness: ${seoTechnicalPct}%${formatDelta(seoTechnicalPct, prevMetrics?.seo?.technicalReadinessPct)} | Lighthouse SEO: ${psi.ok ? `${psi.seoScore}/100` : `N/A (${psi.reason})`} | Indexation: ${indexationRatePct != null ? `${indexationRatePct}%` : "Pass --gsc-indexed <count>"}`,
  );
  console.log(
    `2. [AEO] Schema Readiness:    ${aeoSchemaPct}%${formatDelta(aeoSchemaPct, prevMetrics?.aeo?.schemaReadinessPct)} | Gemini Answer Accuracy: ${aiSearchMetrics ? `${aiSearchMetrics.aeoAccuracyPct}%` : "Set GEMINI_API_KEY to measure"}`,
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
