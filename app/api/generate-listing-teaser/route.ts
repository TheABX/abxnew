import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { searchTerm } = await req.json()

    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 })
    }

    const prompt = `Generate a JSON teaser for a ${searchTerm} for sale. Format it like this:
{
  "businessName": "Melbourne Plumbing Co.",
  "location": "Melbourne, VIC",
  "price": "$420,000",
  "revenue": "$1,200,000",
  "teaserDescription": "Established plumbing business with 15 years of contracts, low overheads, and strong staff in place."
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const teaser = response.choices[0].message.content

    if (!teaser) {
      return NextResponse.json({ error: 'Failed to generate listing teaser' }, { status: 500 })
    }

    return NextResponse.json(JSON.parse(teaser))

  } catch (error) {
    console.error('Error generating listing teaser:', error)
    return NextResponse.json({ error: 'Failed to generate listing teaser' }, { status: 500 })
  }
} 