import { NextResponse } from "next/server";
import { metaConfig, metaGraph } from "@/lib/meta-graph";

export const dynamic = "force-dynamic";

function failureMessage(result: PromiseRejectedResult): string {
  return result.reason instanceof Error
    ? result.reason.message
    : "Unable to verify Meta connection.";
}

export async function GET() {
  try {
    const { facebookPageId, instagramUserId, version } = metaConfig();

    // Independent requests: a Facebook token issue should not hide the
    // working Instagram connection in the status endpoint.
    const [facebookResult, instagramResult] = await Promise.allSettled([
      metaGraph<any>(
        `/${facebookPageId}`,
        {
          fields:
            "id,name,link,fan_count,followers_count,instagram_business_account{id,username}"
        },
        {},
        "facebook"
      ),
      metaGraph<any>(
        `/${instagramUserId}`,
        {
          fields:
            "id,username,name,followers_count,media_count,profile_picture_url"
        },
        {},
        "instagram"
      )
    ]);

    const facebook = facebookResult.status === "fulfilled"
      ? {
          connected: true,
          id: facebookResult.value.id,
          name: facebookResult.value.name,
          link: facebookResult.value.link || null,
          followers:
            facebookResult.value.followers_count ??
            facebookResult.value.fan_count ??
            null,
          linkedInstagram:
            facebookResult.value.instagram_business_account || null
        }
      : {
          connected: false,
          error: failureMessage(facebookResult)
        };

    const instagram = instagramResult.status === "fulfilled"
      ? {
          connected: true,
          id: instagramResult.value.id,
          username: instagramResult.value.username,
          name: instagramResult.value.name || null,
          followers: instagramResult.value.followers_count ?? null,
          mediaCount: instagramResult.value.media_count ?? null,
          profilePictureUrl:
            instagramResult.value.profile_picture_url || null
        }
      : {
          connected: false,
          error: failureMessage(instagramResult)
        };

    return NextResponse.json({
      ok: facebook.connected && instagram.connected,
      graphVersion: version,
      facebook,
      instagram
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify Meta connection."
      },
      { status: 500 }
    );
  }
}
