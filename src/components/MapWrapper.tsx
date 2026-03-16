"use client";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapViewClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "calc(100vh - 130px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#888",
        fontSize: 14,
      }}
    >
      Loading map...
    </div>
  ),
});

export default MapView;
