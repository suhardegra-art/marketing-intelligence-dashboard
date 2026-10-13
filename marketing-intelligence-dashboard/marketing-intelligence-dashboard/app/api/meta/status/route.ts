import { NextResponse } from "next/server";
import { metaConfig, metaGraph } from "@/lib/meta-graph";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { facebookPageId, instagramUserId, version } = metaConfig();

    const [facebook, instagram] = await Promise.all([
      metaGraph<any>(
        `/${facebookPageId}`,
        {
          fields:
            "id,name,link,fan_count,followers_count,instagram_business_account{id,username}"
        }
      ),
      metaGraph<any>(
        `/${instagramUserId}`,
        {
          fields:
            "id,username,name,followers_count,media_count,profile_picture_url"
        }
      )
    ]);

    return NextResponse.json({
      ok: true,
      graphVersion: version,
      facebook: {
        connected: true,
        id: facebook.id,
        name: facebook.name,
        link: facebook.link || null,
        followers:
          facebook.followers_count ??
          facebook.fan_count ??
          null,
        linkedInstagram:
          facebook.instagram_business_account || null
      },
      instagram: {
        connected: true,
        id: instagram.id,
        username: instagram.username,
        name: instagram.name || null,
        followers: instagram.followers_count ?? null,
        mediaCount: instagram.media_count ?? null,
        profilePictureUrl:
          instagram.profile_picture_url || null
      }
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
