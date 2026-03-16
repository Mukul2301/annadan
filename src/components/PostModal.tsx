'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Camera, MapPin, Clock, Loader } from 'lucide-react'

const SOURCES = [
  { id: 'temple', label: '🛕 Temple', },
  { id: 'wedding', label: '💍 Wedding' },
  { id: 'restaurant', label: '🍽️ Restaurant' },
  { id: 'home', label: '🏠 Home cook' },
]

export default function PostModal({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<'form' | 'estimating' | 'preview'>('form')
  const [form, setForm] = useState({ donor_name: '', food_type: '', quantity_kg: '', source: 'temple', hours: '4' })
  const [image, setImage] = useState<string | null>(null)
  const [estimate, setEstimate] = useState<any>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage((reader.result as string).split(',')[1])
    reader.readAsDataURL(file)
  }

  function getLocation() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      setLocation({ lat, lng })
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`)
      const data = await res.json()
      setAddress(data.results[0]?.formatted_address || '')
    })
  }

  async function handleEstimate() {
    if (!form.donor_name || !form.food_type || !form.quantity_kg) return alert('Please fill all fields')
    if (!location) return alert('Please share your location')
    setStep('estimating')
    const res = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: image, quantity_kg: form.quantity_kg, food_type: form.food_type }),
    })
    const data = await res.json()
    setEstimate(data)
    setStep('preview')
  }

  async function handleSubmit() {
    const pickup_until = new Date(Date.now() + parseInt(form.hours) * 3600000).toISOString()
    const { error } = await supabase.from('posts').insert({
      donor_name: form.donor_name,
      food_type: form.food_type,
      quantity_kg: parseFloat(form.quantity_kg),
      meals_estimated: estimate.meals,
      co2_saved_kg: estimate.co2_kg,
      source: form.source,
      lat: location!.lat,
      lng: location!.lng,
      address,
      pickup_until,
      image_url: null,
    })
    if (!error) onSuccess()
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid #EDE8E3', borderRadius: 10,
    fontFamily: 'Sora, sans-serif', fontSize: 14,
    background: 'white', outline: 'none',
  }

  const labelStyle = { fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 6, display: 'block' }

  if (step === 'estimating') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ animation: 'spin 1s linear infinite' }}>
        <Loader size={32} color="var(--saffron)" />
      </div>
      <div style={{ fontWeight: 500 }}>Calculating your impact...</div>
      <div style={{ fontSize: 13, color: '#888' }}>AI is estimating meals & CO₂ saved</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (step === 'preview') return (
    <div style={{ padding: '1.5rem 1.25rem' }}>
      <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>Your impact</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: '1.5rem', fontFamily: 'Noto Serif, serif', fontStyle: 'italic' }}>
        {estimate?.message}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem'
      }}>
        {[
          { label: 'Meals provided', value: estimate?.meals, color: 'var(--saffron)', bg: 'var(--saffron-light)' },
          { label: 'CO₂ saved', value: `${estimate?.co2_kg}kg`, color: 'var(--green)', bg: 'var(--green-light)' },
          { label: 'Food rescued', value: `${form.quantity_kg}kg`, color: '#9B59B6', bg: '#F5EEF8' },
          { label: 'Pickup window', value: `${form.hours}hrs`, color: '#2980B9', bg: '#EBF5FB' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color }}>{value}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#F5F0EB', borderRadius: 12, padding: '0.875rem 1rem',
        fontSize: 13, color: '#555', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <MapPin size={14} color="var(--saffron)" />
        {address || 'Location detected'}
      </div>

      <button onClick={handleSubmit} style={{
        width: '100%', background: 'var(--saffron)', color: 'white',
        border: 'none', borderRadius: 12, padding: '1rem',
        fontWeight: 600, fontSize: 15, cursor: 'pointer',
        fontFamily: 'Sora, sans-serif',
      }}>
        Post this donation
      </button>

      <button onClick={() => setStep('form')} style={{
        width: '100%', background: 'none', color: '#888',
        border: 'none', padding: '0.75rem',
        fontSize: 13, cursor: 'pointer', marginTop: 4,
      }}>
        Edit details
      </button>
    </div>
  )

  return (
    <div style={{ padding: '1.5rem 1.25rem' }}>
      <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>Donate food</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: '1.5rem' }}>Takes less than 60 seconds</div>

      {/* Source selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={labelStyle}>I am a</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SOURCES.map(s => (
            <button key={s.id} onClick={() => setForm(f => ({ ...f, source: s.id }))} style={{
              padding: '0.5rem 0.875rem', borderRadius: 20,
              border: `1.5px solid ${form.source === s.id ? 'var(--saffron)' : '#EDE8E3'}`,
              background: form.source === s.id ? 'var(--saffron-light)' : 'white',
              color: form.source === s.id ? 'var(--saffron-dark)' : '#555',
              fontSize: 13, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
              fontWeight: form.source === s.id ? 500 : 400,
            }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Your name / venue name</label>
          <input style={inputStyle} placeholder="e.g. Shree Ram Temple, Andheri" value={form.donor_name} onChange={e => setForm(f => ({ ...f, donor_name: e.target.value }))} />
        </div>

        <div>
          <label style={labelStyle}>What food?</label>
          <input style={inputStyle} placeholder="e.g. Dal, rice, sabzi, biryani..." value={form.food_type} onChange={e => setForm(f => ({ ...f, food_type: e.target.value }))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Quantity (kg)</label>
            <input style={inputStyle} type="number" placeholder="e.g. 20" value={form.quantity_kg} onChange={e => setForm(f => ({ ...f, quantity_kg: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Available for</label>
            <select style={inputStyle} value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
            </select>
          </div>
        </div>

        {/* Photo */}
        <div>
          <label style={labelStyle}>Photo (optional — improves AI estimate)</label>
          <div onClick={() => fileRef.current?.click()} style={{
            border: '1.5px dashed #D5CFC8', borderRadius: 10, padding: '1.25rem',
            textAlign: 'center', cursor: 'pointer', background: image ? 'var(--saffron-light)' : '#FDFAF7',
          }}>
            <Camera size={20} color={image ? 'var(--saffron)' : '#AAA'} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 13, color: image ? 'var(--saffron)' : '#AAA' }}>{image ? 'Photo added ✓' : 'Tap to add photo'}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
        </div>

        {/* Location */}
        <button onClick={getLocation} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0.75rem 1rem', borderRadius: 10,
          border: `1.5px solid ${location ? 'var(--green)' : '#EDE8E3'}`,
          background: location ? 'var(--green-light)' : 'white',
          color: location ? 'var(--green)' : '#555',
          fontSize: 13, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
          fontWeight: 500, width: '100%',
        }}>
          <MapPin size={16} />
          {location ? `Location detected ✓` : 'Share my location'}
        </button>
      </div>

      <button onClick={handleEstimate} style={{
        width: '100%', marginTop: '1.5rem',
        background: 'var(--saffron)', color: 'white',
        border: 'none', borderRadius: 12, padding: '1rem',
        fontWeight: 600, fontSize: 15, cursor: 'pointer',
        fontFamily: 'Sora, sans-serif',
      }}>
        Calculate my impact →
      </button>
    </div>
  )
}