"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

import { Leaf, Plus, User, Map } from "lucide-react";
import MapView from "@/components/MapViewClient";
import PostModal from "@/components/PostModal";
import DonorProfile from "@/components/DonorProfile";

export default function Home() {
  const [tab, setTab] = useState<"map" | "post" | "profile">("map");
  const [posts, setPosts] = useState<any[]>([]);
  const [totalMeals, setTotalMeals] = useState(0);
  const [totalKg, setTotalKg] = useState(0);

  useEffect(() => {
    fetchPosts();
    fetchTotals();

    const channel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          // Only add if not expired
          if (new Date(payload.new.pickup_until) > new Date()) {
            setPosts((prev) => [payload.new, ...prev]);
            setTotalMeals((prev) => prev + payload.new.meals_estimated);
            setTotalKg((prev) => prev + payload.new.quantity_kg);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          // Remove post from map when it gets marked claimed/expired
          if (payload.new.claimed) {
            setPosts((prev) => prev.filter((p) => p.id !== payload.new.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .gt("pickup_until", new Date().toISOString())
      .eq("claimed", false)
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
  }

  async function fetchTotals() {
    const { data } = await supabase
      .from("posts")
      .select("meals_estimated, quantity_kg");
    if (data) {
      setTotalMeals(data.reduce((s, r) => s + (r.meals_estimated || 0), 0));
      setTotalKg(data.reduce((s, r) => s + (r.quantity_kg || 0), 0));
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* Header */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #EDE8E3",
          padding: "0.875rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--saffron)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Leaf size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1 }}>
              Annadan
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#888",
                fontFamily: "Noto Serif, serif",
                fontStyle: "italic",
              }}
            >
              अन्नदान
            </div>
          </div>
        </div>

        {/* Live counter */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: 16, fontWeight: 600, color: "var(--saffron)" }}
            >
              {totalMeals.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              meals saved
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: 16, fontWeight: 600, color: "var(--green)" }}
            >
              {totalKg.toLocaleString()}kg
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              rescued
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ paddingBottom: 80 }}>
        {tab === "map" && <MapView posts={posts} />}
        {tab === "post" && (
          <PostModal
            onSuccess={() => {
              fetchPosts();
              fetchTotals();
              setTab("map");
            }}
          />
        )}
        {tab === "profile" && (
          <DonorProfile totalMeals={totalMeals} totalKg={totalKg} />
        )}
      </main>

      {/* Bottom nav */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #EDE8E3",
          display: "flex",
          zIndex: 100,
        }}
      >
        {[
          { id: "map", icon: Map, label: "Map" },
          { id: "post", icon: Plus, label: "Donate" },
          { id: "profile", icon: User, label: "Profile" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            style={{
              flex: 1,
              padding: "0.75rem 0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              color: tab === id ? "var(--saffron)" : "#AAA",
              transition: "color 0.2s",
            }}
          >
            <Icon
              size={id === "post" ? 22 : 20}
              strokeWidth={tab === id ? 2.5 : 1.5}
            />
            <span style={{ fontSize: 10, fontWeight: tab === id ? 600 : 400 }}>
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
