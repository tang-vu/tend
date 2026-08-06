import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#244a35",
          borderRadius: "50%",
          color: "#f4f0e6",
          display: "flex",
          fontSize: 34,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        T
      </div>
    ),
    size,
  );
}
