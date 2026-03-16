# 🌿 Annadan — अन्नदान

> India wastes 68 million tonnes of food yearly. 189 million go hungry. The food exists — it just needs connecting.

Annadan is a hyperlocal platform where temples, weddings, restaurants and home cooks post surplus food. Anyone nearby sees it on a live map and gets directions. No sign-up. No food bank. No shame.

---

## Features
- 🗺️ **Live map** — real-time food posts, auto-expire when window closes
- 📦 **Post in 60 seconds** — photo, quantity, pickup window
- 🤖 **AI impact estimate** — meals provided + CO₂ saved per donation
- 🏆 **Donor ranks** — Anna Mitra → Anna Sevak → Anna Datta → Anna Rishi
- 📊 **Shareable impact card** — download or share to WhatsApp

---

## Stack
Next.js · Supabase (real-time) · Leaflet · Groq AI · Vercel

---

## Run locally

```bash
git clone https://github.com/yourusername/annadan.git
cd annadan
npm install
```

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
GROQ_API_KEY=your_groq_key
```

```bash
npm run dev
```

---

## Database setup
Run in Supabase SQL Editor:
```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp default now(),
  donor_name text, food_type text,
  quantity_kg numeric, meals_estimated integer, co2_saved_kg numeric,
  pickup_until timestamp, lat numeric, lng numeric,
  address text, source text, image_url text,
  claimed boolean default false
);
```

---

*Built solo at NextDev Hackathon — "The food already exists. We just connect it."*
