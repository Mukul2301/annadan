import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { quantity_kg, food_type } = await req.json()

    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'You are a food waste analyst. Always respond with valid JSON only. No markdown, no explanation, just the JSON object.',
        },
        {
          role: 'user',
          content: `Food donation details:
- Food type: ${food_type}
- Quantity: ${quantity_kg} kg

Calculate:
1. meals = quantity_kg divided by 0.4 (400g per meal), round to nearest integer
2. co2_kg = quantity_kg multiplied by 2.5, round to 1 decimal
3. message = one warm sentence about this donation's impact

Respond with exactly this JSON:
{"meals": number, "co2_kg": number, "message": "string"}`,
        },
      ],
    })

    const text = response.choices[0].message.content || ''
    console.log('Groq response:', text)

    const cleaned = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(cleaned)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Estimate error:', error)

    // Fallback formula if AI fails
    const { quantity_kg } = await new Response(req.body).json().catch(() => ({ quantity_kg: 1 }))
    const qty = parseFloat(quantity_kg) || 1
    return NextResponse.json({
      meals: Math.round(qty / 0.4),
      co2_kg: Math.round(qty * 2.5 * 10) / 10,
      message: `Your generosity will feed ${Math.round(qty / 0.4)} people today.`,
    })
  }
}