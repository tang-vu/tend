import { ImageResponse } from "next/og";

export const alt =
  "TEND — persistent community stewardship with memory and follow-up";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f4f0e6",
          color: "#17201b",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 82px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px solid rgba(36,74,53,.18)",
            borderRadius: 250,
            display: "flex",
            height: 440,
            position: "absolute",
            right: -90,
            top: -120,
            width: 440,
          }}
        />
        <div
          style={{
            border: "2px solid rgba(36,74,53,.12)",
            borderRadius: 190,
            display: "flex",
            height: 320,
            position: "absolute",
            right: -25,
            top: -58,
            width: 320,
          }}
        />
        <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
          <div
            style={{
              alignItems: "center",
              background: "#244a35",
              borderRadius: 30,
              color: "white",
              display: "flex",
              fontSize: 30,
              fontWeight: 800,
              height: 58,
              justifyContent: "center",
              width: 58,
            }}
          >
            T
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 850,
              letterSpacing: ".16em",
            }}
          >
            TEND
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              color: "#5d8b62",
              display: "flex",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            Persistent community stewardship
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "serif",
              fontSize: 70,
              lineHeight: 1.04,
              maxWidth: 880,
            }}
          >
            Moderation shouldn’t reset with every message.
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            borderTop: "2px solid rgba(36,74,53,.16)",
            display: "flex",
            fontSize: 23,
            justifyContent: "space-between",
            paddingTop: 24,
          }}
        >
          <span>Remembers · continues · follows up</span>
          <span style={{ color: "#5d8b62", fontWeight: 750 }}>
            Built with Minds
          </span>
        </div>
      </div>
    ),
    size,
  );
}
