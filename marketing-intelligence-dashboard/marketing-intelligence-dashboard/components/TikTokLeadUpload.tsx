"use client";

import { useState } from "react";

export default function TikTokLeadUpload() {
  const [result, setResult] = useState<string>("");

  async function upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/tiktok-live/leads/import", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setResult(
      `Success: ${data.inserted || 0} | Duplicate: ${data.duplicate || 0}`
    );
  }

  return (
    <div>
      <label
        style={{
          display: "inline-flex",
          padding: "8px 14px",
          background: "#4059d7",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        Upload Lead CSV

        <input
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
      </label>

      {result && (
        <p style={{ fontSize: 12, marginTop: 8 }}>
          {result}
        </p>
      )}
    </div>
  );
}