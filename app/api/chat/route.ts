import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define an interface for the expected structure of the AI-generated fallback
interface FallbackListing {
  businessName: string;
  location: string;
  price: string;
  revenue: string;
  teaserDescription: string;
}

const allSubCategories = [
  'Plumbing', 'Electrical', 'Building & Construction', 'HVAC', 'Landscaping', 'Painting', 'Roofing', 'Carpentry', 'Handyman', 'Pest Control', 'Cleaning',
  'Fashion & Apparel', 'Electronics', 'Home Goods', 'Health & Beauty', 'Food & Beverage', 'Pet Supplies', 'Digital Products', 'Subscription Boxes', 'Dropshipping',
  'SaaS', 'Mobile App', 'IT Services', 'Web Development & Design', 'Cybersecurity', 'AI & Machine Learning', 'Fintech', 'Edutech', 'Healthtech',
  'Clothing & Textiles', 'Furniture', 'Machinery & Equipment', 'Chemical', 'Automotive Parts', 'Plastics & Rubber',
  'Accounting & Bookkeeping', 'Legal Services', 'Marketing & Advertising', 'Consulting', 'Architecture & Engineering', 'Real Estate Services', 'Financial Advisory',
  'Fashion Boutique', 'Cafe/Coffee Shop', 'Restaurant', 'Bar/Pub', 'Convenience Store', 'Specialty Food Store', 'Gift Shop', 'Bookstore', 'Hair & Beauty Salon',
  'Medical Practice (GP)', 'Dental Clinic', 'Physiotherapy', 'Chiropractic', 'Pharmacy', 'Allied Health', 'Veterinary Clinic',
  'Catering', 'Food Truck', 'Bakery', 'Brewery/Distillery', 'Packaged Food Production',
  'Residential Construction', 'Commercial Construction', 'Civil Engineering', 'Renovation & Remodeling', 'Architectural Services', 'Trade Services',
  'Logistics & Freight', 'Taxi & Ride-sharing', 'Trucking', 'Courier Services', 'Moving Services', 'Bus & Coach Services',
  'Childcare Centre', 'Tutoring Services', 'Registered Training Organisation (RTO)', 'Online Course Provider', 'Educational Resources',
  'Sales Agency', 'Property Management', 'Buyer\'s Agency', 'Commercial Real Estate', 'Strata Management',
  'Financial Planning/Advisory', 'Mortgage Broking', 'Insurance Broking', 'Accounting Firm', 'Bookkeeping Service'
];

const systemPrompt = [
  `You are a business listings assistant. Your goal is to help users find businesses for sale by searching a Supabase database.`,
  `1. Analyze the user's message to identify key search terms like business type, industry, and location.`,
  `2. You have access to a predefined list of business sub-categories: ${allSubCategories.join(', ')}.`,
  `3. Your primary goal is to map the user's query to one of these sub-categories if possible. For example, if the user asks for "blocked drains" or "gas fitting", you should identify 'Plumbing' as the relevant sub-category.`,
  `4. Construct a search query that INCLUDES the identified sub-category AND any other important keywords from the user's query (like location, or specific terms like "drains"). This makes the search more robust.`,
  `5. Respond with ONLY a JSON object in the format: {"keywords": ["keyword1", "keyword2", "etc"]}. For example, for "show me cafes in sydney", you should return {"keywords": ["Cafe", "Sydney"]}. For "brisbane blocked drains", you should return {"keywords": ["Plumbing", "drains", "Brisbane"]}. For "plumbing business in brisbane", you should return {"keywords": ["Plumbing", "Brisbane"]}.`,
  `6. If the user's query is too vague (e.g., "I want to buy a business"), ask clarifying questions to get more details.`
].join('\n');

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const initialResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.5,
    });

    const assistantResponseContent = initialResponse.choices[0].message.content;

    if (!assistantResponseContent) {
      return NextResponse.json({ reply: "I'm sorry, I didn't get that. Could you rephrase?" });
    }

    try {
      const searchParams = JSON.parse(assistantResponseContent);
      if (searchParams.keywords && Array.isArray(searchParams.keywords) && searchParams.keywords.length > 0) {
        // Transform the AI's keywords into an OR-based search string
        const orQuery = searchParams.keywords.join(' | ');
        const userQueryForDisplay = searchParams.keywords.join(' ');

        const { data: listings, error } = await supabase
          .from('listings')
          .select('*')
          .textSearch('fts', orQuery, {
            type: 'websearch',
            config: 'english',
          })
          .limit(2);

        if (error) {
          console.error('Supabase error:', error);
          // Return the error message to the user for visibility
          return NextResponse.json({ reply: `Database error: ${error.message}` });
        }

        if (listings && listings.length > 0) {
          const reply = `Great! Based on '${userQueryForDisplay}', here are a few off-market deals that might be perfect:`;
          return NextResponse.json({ reply, listings });
        } else {
          // ================== FALLBACK LOGIC ==================
          const promptParts = [
            `The user searched for a business but no matching listings were found. User's keywords: "${userQueryForDisplay}"`,
            `Your task is to generate a single JSON object that represents a "fallback listing card".`,
            `**Instructions:**`,
            `1. Analyze the query to extract business type, location, and budget.`,
            `2. Generate a JSON object with these exact keys: "businessName", "location", "price", "revenue", "teaserDescription".`,
            `   - "businessName": "[Business Type] – Not currently listed"`,
            `   - "location": "[Location from query]" (or "Australia-wide")`,
            `   - "price": "Estimated $X–$Y"`,
            `   - "revenue": "Typically $Z+"`,
            `   - "teaserDescription": "We don't currently have a live listing for a [Business Type] in this area. However, businesses like this typically sell in this range and generate similar revenue depending on staff, clients, and location."`,
            `3. **Rules for Price and Revenue:**`,
            `   - If budget is specified, create a range around it.`,
            `   - If no budget, use these defaults:`,
            `     - Nail salon: price "$200k–$500k", revenue "$300k+"`,
            `     - Cafe: price "$100k–$400k", revenue "$300k+"`,
            `     - Plumbing: price "$300k–$700k", revenue "$600k+"`,
            `     - eComm: price "$100k–$800k", revenue "$250k+"`,
            `     - RTO: price "$500k–$2.5M", revenue "$1M+"`,
            `     - Other/Unknown: Use "eComm" as default.`,
            `Now, generate the JSON object for the user's query: "${userQueryForDisplay}"`
          ];
          const fallbackPrompt = promptParts.join('\n');

          const fallbackCompletion = await openai.chat.completions.create({
              model: 'gpt-4-turbo',
              messages: [{ role: 'user', content: fallbackPrompt }],
              temperature: 0.3,
              response_format: { type: "json_object" },
          });

          const fallbackJson = fallbackCompletion.choices[0].message.content;

          if (fallbackJson) {
            const generatedListing: FallbackListing = JSON.parse(fallbackJson);
            const reply = `I couldn't find any exact matches in our live database, but here is a realistic example based on current market data:`;
            
            return NextResponse.json({
              reply,
              listings: [{ ...generatedListing, id: 'ai-fallback-1', isAiGenerated: true }],
            });
          } else {
            return NextResponse.json({ reply: "I couldn't find any listings for that. Please try a different search." });
          }
        }
      }
      return NextResponse.json({ reply: assistantResponseContent });
    } catch (e) {
      // It's not JSON, so it must be a conversational reply.
      return NextResponse.json({ reply: assistantResponseContent });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to get a response from the assistant.' }, { status: 500 });
  }
} 