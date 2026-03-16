"use client";
import { useRef } from "react";
import { Share2, Download } from "lucide-react";

const RANKS = [
  { title: "Anna Mitra", subtitle: "Food Friend", min: 0, color: "#CD7F32" },
  { title: "Anna Sevak", subtitle: "Food Servant", min: 100, color: "#888" },
  { title: "Anna Datta", subtitle: "Food Giver", min: 500, color: "#FFD700" },
  { title: "Anna Rishi", subtitle: "Food Saint", min: 1000, color: "#E8640A" },
];

function getRank(meals: number) {
  return [...RANKS].reverse().find((r) => meals >= r.min) || RANKS[0];
}

function getNextRank(meals: number) {
  return RANKS.find((r) => r.min > meals);
}

export default function DonorProfile({
  totalMeals,
  totalKg,
}: {
  totalMeals: number;
  totalKg: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rank = getRank(totalMeals);
  const next = getNextRank(totalMeals);
  const progress = next
    ? Math.min(100, ((totalMeals - rank.min) / (next.min - rank.min)) * 100)
    : 100;

  function generateCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800,
      H = 450;
    canvas.width = W;
    canvas.height = H;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#2D1B0E");
    bg.addColorStop(1, "#5C3317");
    ctx.fillStyle = bg;
    ctx.roundRect(0, 0, W, H, 24);
    ctx.fill();

    // Subtle pattern dots
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let x = 0; x < W; x += 40) {
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Left accent bar
    ctx.fillStyle = "#E8640A";
    ctx.roundRect(40, 40, 4, H - 80, 2);
    ctx.fill();

    // Annadan title
    ctx.fillStyle = "#E8640A";
    ctx.font = "600 18px serif";
    ctx.fillText("ANNADAN", 60, 72);

    // Devanagari subtitle
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "14px serif";
    ctx.fillText("अन्नदान · Gift of Food", 60, 96);

    // Rank emoji
    ctx.font = "64px serif";
    ctx.fillText("🙏", 60, 210);

    // Rank title
    ctx.fillStyle = rank.color;
    ctx.font = `600 36px serif`;
    ctx.fillText(rank.title, 60, 270);

    // Rank subtitle
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "16px sans-serif";
    ctx.fillText(rank.subtitle, 60, 298);

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 320);
    ctx.lineTo(W - 60, 320);
    ctx.stroke();

    // Stats
    const stats = [
      {
        value: totalMeals.toLocaleString(),
        label: "Meals donated",
        color: "#E8640A",
      },
      { value: `${totalKg}kg`, label: "Food rescued", color: "#2A7A4B" },
      {
        value: `${Math.round(totalKg * 2.5)}kg`,
        label: "CO₂ saved",
        color: "#C4A882",
      },
    ];

    stats.forEach((stat, i) => {
      const x = 60 + i * 240;
      ctx.fillStyle = stat.color;
      ctx.font = "600 32px sans-serif";
      ctx.fillText(stat.value, x, 375);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "13px sans-serif";
      ctx.fillText(stat.label, x, 398);
    });

    // Bottom watermark
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "12px sans-serif";
    ctx.fillText("annadan.app", W - 120, H - 20);

    return canvas;
  }

  function handleDownload() {
    const canvas = generateCard();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "annadan-impact.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleShare() {
    const canvas = generateCard();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      // Try native share (works on mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "annadan-impact.png", {
          type: "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "My Annadan Impact",
            text: `I've donated ${totalMeals} meals through Annadan 🙏`,
            files: [file],
          });
          return;
        }
      }

      // Fallback — copy image to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        alert("Card copied to clipboard! Paste it anywhere.");
      } catch {
        // Final fallback — just download
        handleDownload();
      }
    });
  }

  return (
    <div style={{ padding: "1.5rem 1.25rem" }}>
      {/* Hidden canvas used for generation */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Rank card */}
      <div
        style={{
          background: "linear-gradient(135deg, #2D1B0E 0%, #5C3317 100%)",
          borderRadius: 20,
          padding: "2rem 1.5rem",
          textAlign: "center",
          marginBottom: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>🙏</div>
        <div
          style={{
            color: rank.color,
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          {rank.title}
        </div>
        <div
          style={{
            color: "#C4A882",
            fontSize: 13,
            fontFamily: "Noto Serif, serif",
            fontStyle: "italic",
            marginBottom: "1.5rem",
          }}
        >
          {rank.subtitle}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
          <div>
            <div style={{ color: "white", fontSize: 28, fontWeight: 600 }}>
              {totalMeals.toLocaleString()}
            </div>
            <div style={{ color: "#C4A882", fontSize: 11 }}>meals donated</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div>
            <div style={{ color: "white", fontSize: 28, fontWeight: 600 }}>
              {totalKg.toLocaleString()}
            </div>
            <div style={{ color: "#C4A882", fontSize: 11 }}>kg rescued</div>
          </div>
        </div>
      </div>

      {/* Progress to next rank */}
      {next && (
        <div
          style={{
            background: "white",
            borderRadius: 14,
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            border: "1px solid #EDE8E3",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            <span style={{ fontWeight: 500 }}>Progress to {next.title}</span>
            <span style={{ color: "#888" }}>
              {totalMeals} / {next.min} meals
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "#F5F0EB",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--saffron)",
                borderRadius: 4,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* All ranks */}
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: "0.875rem" }}>
        All ranks
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {RANKS.map((r) => (
          <div
            key={r.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              padding: "0.75rem 1rem",
              borderRadius: 10,
              background:
                rank.title === r.title ? "var(--saffron-light)" : "white",
              border: `1px solid ${rank.title === r.title ? "var(--saffron)" : "#EDE8E3"}`,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: r.color,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{r.subtitle}</div>
            </div>
            <div style={{ fontSize: 11, color: "#AAA" }}>{r.min}+ meals</div>
            {totalMeals >= r.min && (
              <div style={{ fontSize: 12, color: "var(--saffron)" }}>✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Share buttons */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={handleShare}
          style={{
            flex: 1,
            background: "var(--saffron)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "1rem",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "Sora, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Share2 size={16} /> Share card
        </button>
        <button
          onClick={handleDownload}
          style={{
            background: "white",
            color: "var(--earth)",
            border: "1.5px solid #EDE8E3",
            borderRadius: 12,
            padding: "1rem",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "Sora, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Download size={16} /> Download
        </button>
      </div>
    </div>
  );
}
