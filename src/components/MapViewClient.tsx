"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { Clock, List, X } from "lucide-react";

const SOURCE_COLORS: Record<string, string> = {
  temple: "#E8640A",
  wedding: "#9B59B6",
  restaurant: "#E74C3C",
  home: "#2A7A4B",
};

const SOURCE_LABELS: Record<string, string> = {
  temple: "🛕 Temple",
  wedding: "💍 Wedding",
  restaurant: "🍽️ Restaurant",
  home: "🏠 Home",
};

function timeLeft(pickup_until: string) {
  const diff = new Date(pickup_until).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

function MapController({ onMap }: { onMap: (map: any) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
  }, [map]);
  return null;
}

export default function MapViewClient({ posts }: { posts: any[] }) {
  const [selected, setSelected] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([
    19.076, 72.877,
  ]);
  const [showList, setShowList] = useState(false);
  const [mapRef, setMapRef] = useState<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {},
      );

      setLeafletReady(true);
    });
  }, []);

  function flyToPost(post: any) {
    if (mapRef) mapRef.flyTo([post.lat, post.lng], 15, { duration: 0.8 });
    setSelected(post);
    setShowList(false);
  }

  if (!leafletReady)
    return (
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
    );

  return (
    <div style={{ height: "calc(100vh - 130px)", position: "relative" }}>
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController onMap={setMapRef} />

        {posts.map((post) => (
          <CircleMarker
            key={post.id}
            center={[post.lat, post.lng]}
            radius={14}
            pathOptions={{
              fillColor: SOURCE_COLORS[post.source] || "#E8640A",
              fillOpacity: 0.9,
              color: "white",
              weight: 2,
            }}
            eventHandlers={{
              click: () => {
                setSelected(post);
                setShowList(false);
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1000,
          background: "white",
          borderRadius: 10,
          padding: "0.6rem 0.875rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {Object.entries(SOURCE_LABELS).map(([key, label]) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: SOURCE_COLORS[key],
              }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Active posts counter */}
      <button
        onClick={() => {
          setShowList((s) => !s);
          setSelected(null);
        }}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          background: "var(--saffron)",
          color: "white",
          border: "none",
          borderRadius: 20,
          padding: "0.4rem 0.875rem",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(232,100,10,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "Sora, sans-serif",
        }}
      >
        <List size={13} />
        {posts.length} active {posts.length === 1 ? "post" : "posts"}
      </button>

      {/* Posts list panel */}
      {showList && (
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 12,
            zIndex: 1000,
            background: "white",
            borderRadius: 14,
            boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
            width: 260,
            maxHeight: 360,
            overflow: "hidden",
            animation: "slideDown 0.2s ease",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #EDE8E3",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              Available food nearby
            </span>
            <button
              onClick={() => setShowList(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={15} color="#888" />
            </button>
          </div>

          <div style={{ overflowY: "auto", maxHeight: 300 }}>
            {posts.length === 0 ? (
              <div
                style={{
                  padding: "1.5rem",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#888",
                }}
              >
                No active posts right now
              </div>
            ) : (
              posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => flyToPost(post)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #F5F0EB",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "Sora, sans-serif",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: SOURCE_COLORS[post.source] || "#E8640A",
                      marginTop: 2,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontWeight: 500, fontSize: 13, marginBottom: 1 }}
                    >
                      {post.donor_name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#888",
                        marginBottom: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {post.food_type} · {post.quantity_kg}kg
                    </div>
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: SOURCE_COLORS[post.source] || "#E8640A",
                          background: `${SOURCE_COLORS[post.source]}18`,
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {SOURCE_LABELS[post.source]}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#AAA",
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Clock size={9} /> {timeLeft(post.pickup_until)}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--saffron)",
                      }}
                    >
                      {post.meals_estimated}
                    </div>
                    <div style={{ fontSize: 9, color: "#AAA" }}>meals</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            background: "white",
            borderRadius: 16,
            padding: "1.5rem 2rem",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            maxWidth: 260,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>🍱</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
            No food nearby yet
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#888",
              lineHeight: 1.5,
              marginBottom: "1rem",
            }}
          >
            Be the first to donate today.
          </div>
          <div
            style={{ fontSize: 11, color: "var(--saffron)", fontWeight: 500 }}
          >
            TAP DONATE BELOW ↓
          </div>
        </div>
      )}

      {/* Selected post card */}
      {selected && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 1000,
            background: "white",
            borderRadius: 16,
            padding: "1rem 1.25rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            animation: "slideUp 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>
                {SOURCE_LABELS[selected.source]}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {selected.donor_name}
              </div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                {selected.food_type} · {selected.quantity_kg}kg
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: "#F5F0EB",
                border: "none",
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "0.875rem",
              padding: "0.75rem",
              background: "var(--saffron-light)",
              borderRadius: 10,
            }}
          >
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--saffron)",
                }}
              >
                {selected.meals_estimated}
              </div>
              <div style={{ fontSize: 10, color: "#888" }}>meals</div>
            </div>
            <div style={{ width: 1, background: "#EDE8E3" }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{ fontSize: 18, fontWeight: 600, color: "var(--green)" }}
              >
                {selected.co2_saved_kg}kg
              </div>
              <div style={{ fontSize: 10, color: "#888" }}>CO₂ saved</div>
            </div>
            <div style={{ width: 1, background: "#EDE8E3" }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#555",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <Clock size={12} />
                {new Date(selected.pickup_until).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div style={{ fontSize: 10, color: "#888" }}>pickup by</div>
            </div>
          </div>

          {selected.address && (
            <div
              style={{
                marginTop: "0.75rem",
                fontSize: 12,
                color: "#888",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📍 {selected.address}
            </div>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: "100%",
              marginTop: "0.875rem",
              background: "var(--saffron)",
              color: "white",
              borderRadius: 10,
              padding: "0.875rem",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "Sora, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
              boxSizing: "border-box" as const,
            }}
          >
            📍 Get directions
          </a>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .leaflet-container { z-index: 1; }
      `}</style>
    </div>
  );
}
