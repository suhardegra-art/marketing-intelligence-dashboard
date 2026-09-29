"use client";

import { useMemo, useState } from "react";

type PercentageRow = {
  label: string;
  percentage: number;
};

type ViewPercentageRow = PercentageRow & {
  views?: number;
};

type AudienceTab = "age" | "gender" | "device" | "geography";

type Props = {
  ages: PercentageRow[];
  genders: PercentageRow[];
  devices: ViewPercentageRow[];
  geographies: ViewPercentageRow[];
};

const TAB_LABELS: Record<AudienceTab, string> = {
  age: "Age",
  gender: "Gender",
  device: "Device",
  geography: "Top geographies"
};

const SUBTITLES: Record<AudienceTab, string> = {
  age: "Age distribution · selected period",
  gender: "Gender distribution · selected period",
  device: "Device type · selected period",
  geography: "Top geographies · selected period"
};

function titleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatGender(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  if (
    normalized === "userspecified" ||
    normalized === "user_specified"
  ) {
    return "User specified";
  }

  return titleCase(value);
}

function formatCountry(value: string) {
  if (!value) return "Unknown";

  try {
    if (value.length === 2) {
      const displayNames = new Intl.DisplayNames(["en"], {
        type: "region"
      });
      return displayNames.of(value.toUpperCase()) || value;
    }
  } catch {
    // Fallback to original code when Intl.DisplayNames is unavailable.
  }

  return value;
}

export default function YouTubeAudiencePanel({
  ages,
  genders,
  devices,
  geographies
}: Props) {
  const [tab, setTab] = useState<AudienceTab>("age");

  const rows = useMemo(() => {
    if (tab === "age") {
      return ages.map((row) => ({
        label: row.label,
        percentage: row.percentage
      }));
    }

    if (tab === "gender") {
      return genders.map((row) => ({
        label: formatGender(row.label),
        percentage: row.percentage
      }));
    }

    if (tab === "device") {
      return devices.map((row) => ({
        label: row.label,
        percentage: row.percentage
      }));
    }

    return geographies.map((row) => ({
      label: formatCountry(row.label),
      percentage: row.percentage
    }));
  }, [tab, ages, genders, devices, geographies]);

  const maxPercentage = Math.max(
    ...rows.map((row) => row.percentage),
    1
  );

  return (
    <article className="yt-card">
      <div className="yt-card-head compact">
        <div>
          <h2>Audience</h2>
          <p>{SUBTITLES[tab]}</p>
        </div>
      </div>

      <div className="yt-audience-live-tabs">
        {(Object.keys(TAB_LABELS) as AudienceTab[]).map(
          (key) => (
            <button
              key={key}
              type="button"
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {TAB_LABELS[key]}
            </button>
          )
        )}
      </div>

      {rows.length > 0 ? (
        <div className="yt-audience-live-list">
          {rows.map((row) => (
            <div
              className="yt-audience-live-row"
              key={`${tab}-${row.label}`}
            >
              <span>{row.label}</span>

              <div className="yt-audience-live-track">
                <i
                  style={{
                    width: `${Math.max(
                      row.percentage > 0 ? 1.5 : 0,
                      (row.percentage / maxPercentage) * 100
                    )}%`
                  }}
                />
              </div>

              <strong>
                {row.percentage.toFixed(1)}%
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="yt-audience-empty">
          No {TAB_LABELS[tab].toLowerCase()} data is available for
          this selected period.
        </div>
      )}

      <style jsx>{`
        .yt-audience-live-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }

        .yt-audience-live-tabs button {
          min-height: 32px;
          border: 0;
          border-radius: 8px;
          padding: 0 11px;
          background: #f2f5f9;
          color: #69738a;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .yt-audience-live-tabs button.active {
          background: #1268ef;
          color: #ffffff;
        }

        .yt-audience-live-list {
          display: grid;
          gap: 10px;
        }

        .yt-audience-live-row {
          display: grid;
          grid-template-columns: 118px 1fr 46px;
          align-items: center;
          gap: 10px;
          font-size: 10px;
        }

        .yt-audience-live-row > span {
          color: #4f5c74;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .yt-audience-live-track {
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: #eef1f6;
        }

        .yt-audience-live-track i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #1684ff;
          transition: width 280ms ease;
        }

        .yt-audience-live-row strong {
          color: #53617b;
          font-size: 10px;
          text-align: right;
        }

        .yt-audience-empty {
          min-height: 150px;
          display: grid;
          place-items: center;
          border: 1px dashed #e1e6ef;
          border-radius: 12px;
          color: #929bad;
          font-size: 11px;
          text-align: center;
          padding: 20px;
        }

        @media (max-width: 640px) {
          .yt-audience-live-row {
            grid-template-columns: 92px 1fr 42px;
          }
        }
      `}</style>
    </article>
  );
}
