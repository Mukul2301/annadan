import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lon = req.nextUrl.searchParams.get('lon')
  if (!lat || !lon) return NextResponse.json({})

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Annadan Hackathon App/1.0',
        'Accept': 'application/json',
        'Accept-Language': 'en',
        'Referer': 'http://localhost:3000',
      },
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      console.error('Nominatim reverse error:', res.status)
      return NextResponse.json({})
    }

    const data = await res.json()
    return NextResponse.json(data)

  } catch (err) {
    console.error('Reverse geocode error:', err)
    return NextResponse.json({})
  }
}