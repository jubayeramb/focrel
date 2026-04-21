import { ImageResponse } from "next/og";
import { productName, shortDescription, tagline } from "@focrel/brand";

export const alt = `${productName} — ${shortDescription}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(ellipse at top left, #2a1a55 0%, #0a0a0f 60%, #000 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, #b48aef 0%, #6a3fc8 50%, #2e1260 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: "white",
              }}
            />
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>
            {productName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.02,
              maxWidth: 960,
            }}
          >
            {tagline}
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }}>
            {shortDescription}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: 20,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            macOS beta
          </span>
          <span>focrel.app</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
