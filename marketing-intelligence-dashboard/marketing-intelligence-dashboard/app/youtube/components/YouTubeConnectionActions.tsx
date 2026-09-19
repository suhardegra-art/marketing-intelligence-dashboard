"use client";

export default function YouTubeConnectionActions({
  connected
}: {
  connected: boolean;
}) {
  if (!connected) {
    return (
      <a className="yt-connect-button" href="/api/youtube/auth/start">
        Connect YouTube API
      </a>
    );
  }

  return (
    <div className="yt-connection-actions">
      <button
        type="button"
        className="yt-refresh-api-button"
        onClick={() => window.location.reload()}
      >
        ↻ Refresh API
      </button>
      <form action="/api/youtube/disconnect" method="post">
        <button type="submit" className="yt-disconnect-button">
          Disconnect
        </button>
      </form>
    </div>
  );
}
