/**
 * Netlify scheduled functions run on published production deploys only.
 * Safe by default: no import takes place until BOTH scheduled and archive
 * writes are enabled explicitly in server-side Netlify environment variables.
 * Netlify's scheduler endpoint does not accept ordinary incoming web requests.
 */
export const config = { schedule: "15 9 * * *" }; // 09:15 UTC daily

export default async function dailyGoogleArchive() {
  if (process.env.STATS_ARCHIVE_SCHEDULE_ENABLED !== "true"
      || process.env.STATS_ARCHIVE_ENABLED !== "true") {
    return new Response("archive schedule disabled", {status:200});
  }
  const passphrase=process.env.STATS_PASSPHRASE;
  if (!passphrase) return new Response("archive credentials unavailable", {status:503});
  try {
    const result=await fetch("https://minorworks.co/api/stats/google/archive",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"import",confirm:true,passphrase}),
      cache:"no-store",
      signal:AbortSignal.timeout(25000),
    });
    // No credentials or Google response bodies are logged.
    if (!result.ok) {
      console.error("daily_google_archive_failed",result.status);
      return new Response("archive import failed",{status:502});
    }
    console.info("daily_google_archive_ok");
    return new Response("archive import completed",{status:200});
  } catch {
    console.error("daily_google_archive_unavailable");
    return new Response("archive import unavailable",{status:502});
  }
}
