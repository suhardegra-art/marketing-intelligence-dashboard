export type YouTubeVideo = {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  permalink: string;
};

export type YouTubeChannelSnapshot = {
  date: string;
  subscribers: number;
  totalViews: number;
};

export type YouTubeChannelDemo = {
  channelName: string;
  handle: string;
  channelUrl: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  snapshotDate: string;
};

export const youtubeDemoChannel: YouTubeChannelDemo = {
  channelName: "Indomobil eMotor — Demo",
  handle: "@indomobilemotor-demo",
  channelUrl: "https://www.youtube.com/",
  subscribers: 28640,
  totalViews: 4126800,
  totalVideos: 146,
  snapshotDate: "2026-09-16"
};

export const youtubeDemoSnapshots: YouTubeChannelSnapshot[] = [
  { date: "2025-09-18", subscribers: 18140, totalViews: 2298000 },
  { date: "2025-10-16", subscribers: 18760, totalViews: 2387000 },
  { date: "2025-11-17", subscribers: 19480, totalViews: 2494000 },
  { date: "2025-12-15", subscribers: 20140, totalViews: 2608000 },
  { date: "2026-01-16", subscribers: 20910, totalViews: 2746000 },
  { date: "2026-02-16", subscribers: 21940, totalViews: 2919000 },
  { date: "2026-03-16", subscribers: 22610, totalViews: 3048000 },
  { date: "2026-04-16", subscribers: 23260, totalViews: 3187000 },
  { date: "2026-05-16", subscribers: 24120, totalViews: 3341000 },
  { date: "2026-06-16", subscribers: 24980, totalViews: 3519000 },
  { date: "2026-07-16", subscribers: 25840, totalViews: 3706000 },
  { date: "2026-08-16", subscribers: 27040, totalViews: 3943000 },
  { date: "2026-08-28", subscribers: 27480, totalViews: 4009000 },
  { date: "2026-09-02", subscribers: 27720, totalViews: 4042000 },
  { date: "2026-09-06", subscribers: 27960, totalViews: 4069000 },
  { date: "2026-09-09", subscribers: 28110, totalViews: 4084000 },
  { date: "2026-09-11", subscribers: 28260, totalViews: 4097000 },
  { date: "2026-09-13", subscribers: 28430, totalViews: 4110000 },
  { date: "2026-09-15", subscribers: 28570, totalViews: 4120000 },
  { date: "2026-09-16", subscribers: 28640, totalViews: 4126800 }
];

export const youtubeDemoVideos: YouTubeVideo[] = [
  { id: "yt-demo-001", title: "Tyranno X — Explore Beyond the City", publishedAt: "2026-09-16T02:30:00Z", views: 68400, likes: 4120, comments: 286, shares: 740, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-002", title: "QT Pro: 140 KM untuk Aktivitas Seharian?", publishedAt: "2026-09-14T04:00:00Z", views: 52100, likes: 3180, comments: 245, shares: 518, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-003", title: "Test Ride Sprinto — Accelerate with Style", publishedAt: "2026-09-12T08:00:00Z", views: 39600, likes: 2410, comments: 164, shares: 326, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-004", title: "Adora Daily Commute: Praktis untuk Kota", publishedAt: "2026-09-09T03:15:00Z", views: 33800, likes: 1980, comments: 132, shares: 271, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-005", title: "Cara Charging Motor Listrik di Rumah", publishedAt: "2026-09-05T06:45:00Z", views: 29600, likes: 1740, comments: 188, shares: 354, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-006", title: "Tyranno Adventure Ride — Face Your Challenge", publishedAt: "2026-08-30T01:20:00Z", views: 88200, likes: 5260, comments: 336, shares: 920, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-007", title: "QT vs QT Pro — Mana yang Cocok Buat Kamu?", publishedAt: "2026-08-22T07:00:00Z", views: 74600, likes: 4310, comments: 421, shares: 812, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-008", title: "Hemat BBM? Hitung Biaya Motor Listrik Setahun", publishedAt: "2026-08-10T05:00:00Z", views: 101400, likes: 6120, comments: 508, shares: 1180, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-009", title: "Kenalan dengan Fitur Pintar Adora", publishedAt: "2026-07-18T04:30:00Z", views: 61200, likes: 3380, comments: 214, shares: 446, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-010", title: "Tyranno X First Look — Lebih Bold, Lebih Jauh", publishedAt: "2026-06-26T09:00:00Z", views: 126800, likes: 8120, comments: 684, shares: 1510, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-011", title: "Sprinto City Night Ride", publishedAt: "2026-05-30T11:30:00Z", views: 57400, likes: 2940, comments: 173, shares: 398, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-012", title: "Motor Listrik untuk Perjalanan Harian", publishedAt: "2026-04-12T05:30:00Z", views: 83400, likes: 4710, comments: 302, shares: 714, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-013", title: "QT Launch Highlights — Melaju Untuk Negeri", publishedAt: "2026-02-20T03:00:00Z", views: 148600, likes: 9860, comments: 912, shares: 2210, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-014", title: "Tyranno Long Ride Experience", publishedAt: "2025-12-15T02:00:00Z", views: 69400, likes: 3850, comments: 242, shares: 506, permalink: "https://www.youtube.com/" },
  { id: "yt-demo-015", title: "Indomobil eMotor — Electric Mobility Journey", publishedAt: "2025-10-08T06:00:00Z", views: 112900, likes: 6520, comments: 427, shares: 1090, permalink: "https://www.youtube.com/" }
];
