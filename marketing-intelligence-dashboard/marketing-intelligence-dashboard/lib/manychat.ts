export type ManyChatSendResult = {
  status: string;
  raw: unknown;
};

function getApiKey() {
  const apiKey = process.env.MANYCHAT_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("MANYCHAT_API_KEY is not configured.");
  }

  return apiKey;
}

export async function sendManyChatInstagramText(
  subscriberId: string,
  text: string
): Promise<ManyChatSendResult> {
  const apiKey = getApiKey();
  const numericSubscriberId = Number(subscriberId);

  if (
    !Number.isInteger(numericSubscriberId) ||
    numericSubscriberId <= 0
  ) {
    throw new Error(
      `Invalid ManyChat contact ID: ${subscriberId}`
    );
  }

  const cleanText = text.trim();

  if (!cleanText) {
    throw new Error("Approved reply text is empty.");
  }

  const response = await fetch(
    "https://api.manychat.com/fb/sending/sendContent",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subscriber_id: numericSubscriberId,
        data: {
          version: "v2",
          content: {
            type: "instagram",
            messages: [
              {
                type: "text",
                text: cleanText
              }
            ]
          }
        }
      }),
      cache: "no-store"
    }
  );

  const rawText = await response.text();
  let payload: any = {};

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(
      `ManyChat returned a non-JSON response (HTTP ${response.status}).`
    );
  }

  if (!response.ok || payload?.status === "error") {
    const message =
      payload?.message ||
      payload?.error ||
      payload?.details ||
      `ManyChat API HTTP ${response.status}`;

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  if (payload?.status && payload.status !== "success") {
    throw new Error(
      `ManyChat send returned status: ${payload.status}`
    );
  }

  return {
    status: payload?.status || "success",
    raw: payload
  };
}
