export async function getTikTokLiveData() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Supabase missing");
  }

  const sessions = await fetch(
    `${url}/rest/v1/tiktok_live_sessions?select=*`,
    {
      headers: {
        apikey: key,
      },
      cache: "no-store",
    }
  );

  const leads = await fetch(
    `${url}/rest/v1/tiktok_live_leads?select=*`,
    {
      headers: {
        apikey: key,
      },
      cache: "no-store",
    }
  );

  return {
    sessions: await sessions.json(),
    leads: await leads.json(),
  };
}