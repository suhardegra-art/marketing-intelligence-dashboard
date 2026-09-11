export type SupabaseConnectionStatus = {
  configured: boolean;
  connected: boolean;
  accountCount: number | null;
  message: string;
};

function parseCount(contentRange: string | null): number | null {
  if (!contentRange) return null;
  const slash = contentRange.lastIndexOf("/");
  if (slash === -1) return null;
  const raw = contentRange.slice(slash + 1);
  if (raw === "*") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function getSupabaseConnectionStatus(): Promise<SupabaseConnectionStatus> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    return {
      configured: false,
      connected: false,
      accountCount: null,
      message: "Supabase environment variables are not configured yet."
    };
  }

  try {
    const response = await fetch(`${url}/rest/v1/social_accounts?select=id`, {
      method: "GET",
      headers: {
        apikey: secretKey,
        Prefer: "count=exact",
        Range: "0-0"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Supabase connection test failed", response.status, body);
      return {
        configured: true,
        connected: false,
        accountCount: null,
        message: `Supabase responded with HTTP ${response.status}.`
      };
    }

    return {
      configured: true,
      connected: true,
      accountCount: parseCount(response.headers.get("content-range")) ?? 0,
      message: "Supabase is connected and social_accounts can be read."
    };
  } catch (error) {
    console.error("Supabase connection test error", error);
    return {
      configured: true,
      connected: false,
      accountCount: null,
      message: "The dashboard could not reach Supabase."
    };
  }
}
