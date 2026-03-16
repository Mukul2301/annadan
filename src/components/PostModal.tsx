"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Camera, MapPin, Loader } from "lucide-react";

const SOURCES = [
  { id: "temple", label: "🛕 Temple" },
  { id: "wedding", label: "💍 Wedding" },
  { id: "restaurant", label: "🍽️ Restaurant" },
  { id: "home", label: "🏠 Home cook" },
];

export default function PostModal({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<"form" | "estimating" | "preview">("form");
  const [form, setForm] = useState({
    donor_name: "",
    food_type: "",
    quantity_kg: "",
    source: "temple",
    hours: "4",
    address: "",
  });
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImage(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  function getLocation() {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        // Free reverse geocoding via Nominatim — no API key needed
        try {
          const res = await fetch(`/api/reverse?lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data.display_name) {
            setForm((f) => ({ ...f, address: data.display_name }));
          }
        } catch {
          // silently fail — address is optional
        }
        setLocating(false);
      },
      () => {
        alert("Could not get location. Please enter address manually.");
        setLocating(false);
      },
    );
  }

  async function geocodeAddress(
    addr: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data.length === 0) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {
      return null;
    }
  }

  async function fetchSuggestions(query: string) {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }

  async function handleEstimate() {
    if (!form.donor_name || !form.food_type || !form.quantity_kg) {
      return alert("Please fill in name, food type and quantity");
    }

    let finalLocation = location;

    // No GPS — try to geocode typed address
    if (!finalLocation) {
      if (!form.address)
        return alert("Please share location or enter an address");
      const coords = await geocodeAddress(form.address);
      if (!coords)
        return alert(
          "Could not find that address. Please try a more specific address.",
        );
      finalLocation = coords;
      setLocation(coords);
    }

    setStep("estimating");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity_kg: form.quantity_kg,
          food_type: form.food_type,
        }),
      });
      const data = await res.json();
      setEstimate(data);
      setStep("preview");
    } catch {
      alert("Something went wrong. Please try again.");
      setStep("form");
    }
  }

  async function handleSubmit() {
    const pickup_until = new Date(
      Date.now() + parseInt(form.hours) * 3600000,
    ).toISOString();

    const { error } = await supabase.from("posts").insert({
      donor_name: form.donor_name,
      food_type: form.food_type,
      quantity_kg: parseFloat(form.quantity_kg),
      meals_estimated: estimate.meals,
      co2_saved_kg: estimate.co2_kg,
      source: form.source,
      lat: location!.lat,
      lng: location!.lng,
      address: form.address || "Location shared",
      pickup_until,
      image_url: null,
    });

    if (error) {
      console.error("Supabase error:", error);
      alert("Failed to post. Check console for details.");
      return;
    }
    onSuccess();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: "1.5px solid #EDE8E3",
    borderRadius: 10,
    fontFamily: "Sora, sans-serif",
    fontSize: 14,
    background: "white",
    outline: "none",
    color: "var(--earth)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "#666",
    marginBottom: 6,
    display: "block",
  };

  // ── Estimating ─────────────────────────────────────────────────
  if (step === "estimating")
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: 16,
        }}
      >
        <div style={{ animation: "spin 1s linear infinite" }}>
          <Loader size={32} color="var(--saffron)" />
        </div>
        <div style={{ fontWeight: 500 }}>Calculating your impact...</div>
        <div style={{ fontSize: 13, color: "#888" }}>
          Estimating meals & CO₂ saved
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  // ── Preview ────────────────────────────────────────────────────
  if (step === "preview")
    return (
      <div style={{ padding: "1.5rem 1.25rem" }}>
        <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>
          Your impact
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#888",
            marginBottom: "1.5rem",
            fontFamily: "Noto Serif, serif",
            fontStyle: "italic",
          }}
        >
          {estimate?.message}
        </div>

        {imagePreview && (
          <img
            src={imagePreview}
            alt="Food"
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              borderRadius: 12,
              marginBottom: "1rem",
            }}
          />
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            {
              label: "Meals provided",
              value: estimate?.meals,
              color: "var(--saffron)",
              bg: "var(--saffron-light)",
            },
            {
              label: "CO₂ saved",
              value: `${estimate?.co2_kg}kg`,
              color: "var(--green)",
              bg: "var(--green-light)",
            },
            {
              label: "Food rescued",
              value: `${form.quantity_kg}kg`,
              color: "#9B59B6",
              bg: "#F5EEF8",
            },
            {
              label: "Pickup window",
              value: `${form.hours}hrs`,
              color: "#2980B9",
              bg: "#EBF5FB",
            },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              style={{
                background: bg,
                borderRadius: 12,
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 600, color }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "#F5F0EB",
            borderRadius: 12,
            padding: "0.875rem 1rem",
            fontSize: 13,
            color: "#555",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MapPin size={14} color="var(--saffron)" />
          {form.address || "Location shared"}
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            background: "var(--saffron)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "1rem",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            fontFamily: "Sora, sans-serif",
          }}
        >
          Post this donation
        </button>

        <button
          onClick={() => setStep("form")}
          style={{
            width: "100%",
            background: "none",
            color: "#888",
            border: "none",
            padding: "0.75rem",
            fontSize: 13,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          ← Edit details
        </button>
      </div>
    );

  // ── Form ───────────────────────────────────────────────────────
  return (
    <div style={{ padding: "1.5rem 1.25rem" }}>
      <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>
        Donate food
      </div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>
        Takes less than 60 seconds
      </div>

      {/* Source */}
      <div style={{ marginBottom: "1.25rem" }}>
        <span style={labelStyle}>I am a</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setForm((f) => ({ ...f, source: s.id }))}
              style={{
                padding: "0.5rem 0.875rem",
                borderRadius: 20,
                border: `1.5px solid ${form.source === s.id ? "var(--saffron)" : "#EDE8E3"}`,
                background:
                  form.source === s.id ? "var(--saffron-light)" : "white",
                color: form.source === s.id ? "var(--saffron-dark)" : "#555",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "Sora, sans-serif",
                fontWeight: form.source === s.id ? 500 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Your name / venue name</label>
          <input
            style={inputStyle}
            placeholder="e.g. Shree Ram Temple, Andheri"
            value={form.donor_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, donor_name: e.target.value }))
            }
          />
        </div>

        <div>
          <label style={labelStyle}>What food?</label>
          <input
            style={inputStyle}
            placeholder="e.g. Dal, rice, sabzi, biryani..."
            value={form.food_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, food_type: e.target.value }))
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <div>
            <label style={labelStyle}>Quantity (kg)</label>
            <input
              style={inputStyle}
              type="number"
              min="0.5"
              placeholder="e.g. 20"
              value={form.quantity_kg}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity_kg: e.target.value }))
              }
            />
          </div>
          <div>
            <label style={labelStyle}>Available for</label>
            <select
              style={inputStyle}
              value={form.hours}
              onChange={(e) =>
                setForm((f) => ({ ...f, hours: e.target.value }))
              }
            >
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
            </select>
          </div>
        </div>

        {/* Photo */}
        <div>
          <label style={labelStyle}>Photo (optional)</label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: "1.5px dashed #D5CFC8",
              borderRadius: 10,
              padding: "1.25rem",
              textAlign: "center",
              cursor: "pointer",
              background: imagePreview ? "var(--saffron-light)" : "#FDFAF7",
              overflow: "hidden",
            }}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="preview"
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            ) : (
              <>
                <Camera
                  size={20}
                  color="#AAA"
                  style={{ margin: "0 auto 6px" }}
                />
                <div style={{ fontSize: 13, color: "#AAA" }}>
                  Tap to add photo
                </div>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImage}
            style={{ display: "none" }}
          />
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Location</label>
          <button
            onClick={getLocation}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: `1.5px solid ${location ? "var(--green)" : "#EDE8E3"}`,
              background: location ? "var(--green-light)" : "white",
              color: location ? "var(--green)" : "#555",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "Sora, sans-serif",
              fontWeight: 500,
              width: "100%",
              marginBottom: 8,
            }}
          >
            <MapPin size={16} />
            {locating
              ? "Detecting..."
              : location
                ? "Location detected ✓"
                : "Use my current location"}
          </button>

          {/* Manual address with suggestions */}
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle, fontSize: 13 }}
              placeholder="Or type address e.g. Andheri, Mumbai"
              value={form.address}
              onChange={(e) => {
                setForm((f) => ({ ...f, address: e.target.value }));
                fetchSuggestions(e.target.value);
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "white",
                  border: "1.5px solid #EDE8E3",
                  borderRadius: 10,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  zIndex: 9999,
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => {
                      setForm((f) => ({ ...f, address: s.display_name }));
                      setLocation({
                        lat: parseFloat(s.lat),
                        lng: parseFloat(s.lon),
                      });
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      background: "none",
                      border: "none",
                      borderBottom:
                        i < suggestions.length - 1
                          ? "1px solid #F5F0EB"
                          : "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "Sora, sans-serif",
                      fontSize: 12,
                      color: "var(--earth)",
                      lineHeight: 1.4,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--saffron)",
                        marginTop: 1,
                        flexShrink: 0,
                      }}
                    >
                      📍
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                      }}
                    >
                      {s.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleEstimate}
        style={{
          width: "100%",
          marginTop: "1.5rem",
          background: "var(--saffron)",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "1rem",
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
          fontFamily: "Sora, sans-serif",
        }}
      >
        Calculate my impact →
      </button>
    </div>
  );
}
