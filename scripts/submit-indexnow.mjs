const INDEXNOW_KEY = "fitai-indexnow-20261115";

function parseArgs(argv) {
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fitai.chien204.id.vn";
  let dryRun = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--url" && argv[i + 1]) {
      baseUrl = argv[++i];
    } else if (argv[i] === "--dry-run") {
      dryRun = true;
    }
  }
  return { baseUrl: baseUrl.replace(/\/+$/u, ""), dryRun };
}

async function main() {
  const { baseUrl, dryRun } = parseArgs(process.argv.slice(2));
  const parsedBase = new URL(baseUrl);
  const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
  if (!sitemapRes.ok) {
    throw new Error(`Failed to fetch sitemap.xml: HTTP ${sitemapRes.status}`);
  }
  const xml = await sitemapRes.text();
  const urlList = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/giu)).map((m) => m[1].trim());
  if (urlList.length === 0) {
    throw new Error("No <loc> URLs found in sitemap.xml");
  }

  const keyLocation = `${baseUrl}/${INDEXNOW_KEY}.txt`;
  const keyRes = await fetch(keyLocation);
  const keyBody = keyRes.ok ? (await keyRes.text()).trim() : "";
  if (keyBody !== INDEXNOW_KEY) {
    throw new Error(`IndexNow key check failed at ${keyLocation} (status ${keyRes.status})`);
  }

  const payload = {
    host: parsedBase.host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList,
  };

  if (dryRun) {
    console.log("[indexnow] Dry run validated:", payload);
    return;
  }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`IndexNow submission failed: HTTP ${res.status} ${text}`);
  }
  console.log(`[indexnow] Submitted ${urlList.length} URLs (HTTP ${res.status})`);
}

main().catch((error) => {
  console.error("[indexnow] Error:", error);
  process.exitCode = 1;
});
