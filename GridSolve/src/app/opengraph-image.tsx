import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "#07080a",
          color: "#e6e7ea",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: "2px solid rgba(61, 123, 255, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: "#5b93ff",
              }}
            />
          </div>
          <span style={{ fontSize: 36, fontWeight: 600 }}>GridSolve</span>
        </div>
        <p
          style={{
            fontSize: 52,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: 900,
            margin: 0,
          }}
        >
          {siteConfig.tagline}
        </p>
        <p
          style={{
            fontSize: 24,
            lineHeight: 1.5,
            color: "#9ca3af",
            maxWidth: 820,
            marginTop: 24,
          }}
        >
          {siteConfig.description}
        </p>
      </div>
    ),
    { ...size }
  );
}
