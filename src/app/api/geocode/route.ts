import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) return NextResponse.json([])

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Annadan/1.0' },
      cache: 'no-store',
    })

    if (!res.ok) return NextResponse.json([])

    const data = await res.json()

    // Normalize to same format as Nominatim so PostModal doesn't need changes
    const results = data.features?.map((f: any) => ({
      display_name: [
        f.properties.name,
        f.properties.street,
        f.properties.city,
        f.properties.state,
        f.properties.country,
      ].filter(Boolean).join(', '),
      lat: String(f.geometry.coordinates[1]),
      lon: String(f.geometry.coordinates[0]),
    })) || []

    return NextResponse.json(results)

  } catch (err) {
    console.error('Geocode error:', err)
    return NextResponse.json([])
  }
}