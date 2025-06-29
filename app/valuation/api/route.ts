import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { calculateEcommerceValuation, calculateTradeValuation, calculateGenericValuation, EcommerceInput, TradeInput, GenericInput } from '../valuationUtils'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Calculate valuation based on industry
    let calculatedValuation = 0
    let valuationMethod = ''
    let calculationDetails = ''
    let drivers: string[] = [];
    let risks: string[] = [];
    let recommendations: string[] = [];
    let metrics: any = {};

    if (body.industry === 'E-commerce') {
      const ecommerceData = body.industry_specific_data || {}
      const input: EcommerceInput = {
        revenue: Number(ecommerceData.annualRevenue) || 0,
        netProfit: Number(ecommerceData.netProfit) || 0,
        addBacks: Number(ecommerceData.ownerAddBacks) || 0,
        model: ecommerceData.businessModel || 'Dropshipping',
        traffic: ecommerceData.trafficSource || '100% Paid Ads',
        ownerHours: ecommerceData.ownerInvolvement === '< 5 hrs/week' ? 3 : 
                   ecommerceData.ownerInvolvement === '5-15 hrs/week' ? 10 : 20,
        inventory: Number(ecommerceData.inventoryValue) || 0
      }
      
      calculatedValuation = calculateEcommerceValuation(input)
      valuationMethod = 'E-commerce SDE Multiple Method'
      const sde = input.netProfit + input.addBacks;
      let multiple = 2.5;
      if (input.revenue > 1000000) multiple += 0.5;
      if (input.revenue > 5000000) multiple += 1.0;
      if (input.model === 'Subscription') multiple += 0.5;
      else if (input.model === 'Digital Product') multiple += 0.75;
      else if (input.model === 'Own Inventory') multiple += 0.25;
      else if (input.model === 'Dropshipping') multiple -= 0.25;
      if (input.traffic === 'Mostly Organic') multiple += 0.5;
      else if (input.traffic === '100% Paid Ads') multiple -= 0.25;
      if (input.ownerHours < 5) multiple += 0.25;
      else if (input.ownerHours > 15) multiple -= 0.25;
      calculationDetails = `SDE: $${sde}, Multiple: ${multiple.toFixed(2)}x`
      // Metrics for insights
      metrics = {
        revenue: input.revenue,
        netProfit: input.netProfit,
        addBacks: input.addBacks,
        sde: sde,
        multiple: multiple,
        profitMargin: input.revenue > 0 ? ((input.netProfit / input.revenue) * 100) : 0,
        recurringRevenue: 0, // Not available in ecom basic
        ownerInvolvement: ecommerceData.ownerInvolvement,
        model: input.model,
        traffic: input.traffic,
        inventory: input.inventory
      };
      // Drivers
      if (metrics.profitMargin > 15) drivers.push(`Strong profit margin (${metrics.profitMargin.toFixed(1)}%)`);
      if (['Subscription', 'Digital Product'].includes(metrics.model)) drivers.push(`High value business model (${metrics.model})`);
      if (metrics.traffic === 'Mostly Organic') drivers.push('Strong organic traffic');
      // Risks
      if (metrics.ownerInvolvement === '15+ hrs/week') {
        risks.push('High owner involvement');
        recommendations.push('Reduce owner involvement by delegating daily operations.');
      }
      if (metrics.traffic === '100% Paid Ads') {
        risks.push('Heavy reliance on paid ads');
        recommendations.push('Diversify traffic sources to include more organic channels.');
      }
      if (metrics.profitMargin < 10) {
        risks.push('Low profit margin');
        recommendations.push('Review pricing and cost structure to improve profit margin.');
      }
    } else if (body.industry === 'Trade Business') {
      const tradeData = body.industry_specific_data || {}
      const input: TradeInput = {
        revenue: Number(tradeData.annualRevenue) || 0,
        netProfit: Number(tradeData.netProfit) || 0,
        ownerWage: Number(tradeData.ownerWage) || 0,
        addBacks: Number(tradeData.addBacks) || 0,
        equipmentValue: Number(tradeData.equipmentValue) || 0,
        vehicleValue: Number(tradeData.vehicleValue) || 0,
        debt: Number(tradeData.businessDebts) || 0,
        recurring: tradeData.recurringRevenue === 'Yes',
        staffCount: Number(tradeData.numberOfStaff) || 0,
        ownerInvolvement: tradeData.ownerInvolvement || 'Medium',
        yearsInOperation: Number(body.yearsInOperation) || 0,
        topClientRevenuePct: Number(tradeData.clientConcentration) || 0
      }
      
      calculatedValuation = calculateTradeValuation(input)
      valuationMethod = 'Trade Business SDE Multiple Method'
      const sde = input.netProfit + input.ownerWage + input.addBacks;
      let multiple = 2.0;
      if (input.recurring) multiple += 0.5;
      if (input.staffCount > 2) multiple += 0.25;
      if (input.ownerInvolvement === 'Low') multiple += 0.25;
      else if (input.ownerInvolvement === 'High') multiple -= 0.25;
      if (input.yearsInOperation > 5) multiple += 0.25;
      if ((input.topClientRevenuePct || 0) > 50) multiple -= 0.25;
      calculationDetails = `SDE: $${sde}, Multiple: ${multiple.toFixed(2)}x`
      // Metrics for insights
      metrics = {
        revenue: input.revenue,
        netProfit: input.netProfit,
        addBacks: input.addBacks,
        sde: sde,
        multiple: multiple,
        profitMargin: input.revenue > 0 ? ((input.netProfit / input.revenue) * 100) : 0,
        recurring: input.recurring,
        staffCount: input.staffCount,
        ownerInvolvement: input.ownerInvolvement,
        yearsInOperation: input.yearsInOperation,
        topClientRevenuePct: input.topClientRevenuePct
      };
      // Drivers
      if (metrics.profitMargin > 15) drivers.push(`Strong profit margin (${metrics.profitMargin.toFixed(1)}%)`);
      if (metrics.recurring) drivers.push('Recurring revenue model');
      if (metrics.staffCount > 2) drivers.push('Established team');
      if (metrics.yearsInOperation > 5) drivers.push('Long operating history');
      // Risks
      if (metrics.ownerInvolvement === 'High') {
        risks.push('High owner involvement');
        recommendations.push('Reduce owner involvement by delegating daily operations.');
      }
      if (metrics.topClientRevenuePct > 50) {
        risks.push(`Customer concentration: ${metrics.topClientRevenuePct}% from top clients`);
        recommendations.push('Diversify your customer base to reduce risk.');
      }
      if (metrics.profitMargin < 10) {
        risks.push('Low profit margin');
        recommendations.push('Review pricing and cost structure to improve profit margin.');
      }
    } else {
      // Generic calculation for other industries
      const genericData = body.industry_specific_data || {}
      const input: GenericInput = {
        revenue: Number(genericData.annualRevenue) || 0,
        netProfit: Number(genericData.netProfit) || 0,
        ownerWage: Number(genericData.ownerWage) || 0,
        addBacks: Number(genericData.addBacks) || 0,
        assetValue: Number(genericData.assetValue) || 0,
        debt: Number(genericData.debt) || 0
      }
      
      calculatedValuation = calculateGenericValuation(input)
      valuationMethod = 'Generic SDE Multiple Method'
      const sde = input.netProfit + (input.ownerWage || 0) + (input.addBacks || 0);
      let multiple = 2.5;
      if (input.revenue > 1000000) multiple += 0.5;
      if (input.revenue > 5000000) multiple += 1.0;
      if (sde > 250000) multiple += 0.25;
      calculationDetails = `SDE: $${sde}, Multiple: ${multiple.toFixed(2)}x`
      // Metrics for insights
      metrics = {
        revenue: input.revenue,
        netProfit: input.netProfit,
        addBacks: input.addBacks,
        sde: sde,
        multiple: multiple,
        profitMargin: input.revenue > 0 ? ((input.netProfit / input.revenue) * 100) : 0,
        ownerInvolvement: genericData.ownerInvolvement,
        assetValue: input.assetValue
      };
      // Drivers
      if (metrics.profitMargin > 15) drivers.push(`Strong profit margin (${metrics.profitMargin.toFixed(1)}%)`);
      if (metrics.assetValue && metrics.assetValue > 0) drivers.push('Significant asset base');
      // Risks
      if (metrics.ownerInvolvement === 'High') {
        risks.push('High owner involvement');
        recommendations.push('Reduce owner involvement by delegating daily operations.');
      }
      if (metrics.profitMargin < 10) {
        risks.push('Low profit margin');
        recommendations.push('Review pricing and cost structure to improve profit margin.');
      }
    }

    // Format all submitted fields for the prompt
    const formattedFields = Object.entries(body)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n')

    const prompt = `
You are a professional business analyst. A client has submitted the following information:\n
${formattedFields}

I have calculated a preliminary valuation using ${valuationMethod}:
- Calculated Valuation: $${calculatedValuation.toLocaleString()}
- ${calculationDetails}

Please provide a comprehensive business valuation analysis that includes:
1. Confirmation or adjustment of the calculated valuation range
2. Additional valuation methods that could be applied
3. Key factors that influence this business's value
4. Risk factors and growth opportunities
5. Recommendations for improving business value
6. Market context and industry benchmarks

Provide your analysis in a clear, professional format suitable for business owners.
`

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const valuationResult = chatResponse.choices[0].message.content

    // Helper function to extract sections from the OpenAI response
    function extractSection(text: string, headerNumber: number): string {
      if (!text) return '';
      // Matches: 1. **Calculated Valuation Confirmation:** (with or without bold, with colon)
      const regex = new RegExp(
        `${headerNumber}\\.\\s*\\*\\*(.*?)\\*\\*:?\\s*(.*?)(?=\\n\\d+\\.\\s*\\*\\*|$)`,
        's'
      );
      const match = text.match(regex);
      return match ? match[2].trim() : '';
    }

    // Extract sections based on actual AI output headers
    const safeValuationResult = valuationResult || '';
    const section1 = extractSection(safeValuationResult, 1);
    const section2 = extractSection(safeValuationResult, 2);
    const section3 = extractSection(safeValuationResult, 3);
    const section4 = extractSection(safeValuationResult, 4);
    const section5 = extractSection(safeValuationResult, 5);
    const section6 = extractSection(safeValuationResult, 6);

    return NextResponse.json({ 
      valuation: valuationResult,
      calculatedValue: calculatedValuation,
      method: valuationMethod,
      drivers,
      risks,
      recommendations,
      metrics,
      form_data: body,  // Include the original form data
      aiSections: {
        valuationConfirmation: section1,
        valuationMethods: section2,
        keyFactors: section3,
        risksAndOpportunities: section4,
        recommendations: section5,
        benchmarks: section6,
        fullLetter: valuationResult
      }
    })
  } catch (err) {
    console.error('Valuation API error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
