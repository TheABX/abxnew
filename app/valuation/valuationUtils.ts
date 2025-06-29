export type EcommerceInput = {
  revenue: number;
  netProfit: number;
  addBacks: number;
  model: 'Dropshipping' | 'Own Inventory' | 'Subscription' | 'Amazon FBA' | 'Digital Product';
  traffic: '100% Paid Ads' | 'Mix of Paid & Organic' | 'Mostly Organic';
  ownerHours: number;
  inventory: number;
};

export function calculateEcommerceValuation(input: EcommerceInput): number {
  const { netProfit, addBacks, revenue, model, traffic, ownerHours, inventory } = input;
  const sde = netProfit + addBacks;
  let multiple = 2.5;
  if (revenue > 1000000) multiple += 0.5;
  if (revenue > 5000000) multiple += 1.0;
  if (model === 'Subscription') multiple += 0.5;
  else if (model === 'Digital Product') multiple += 0.75;
  else if (model === 'Own Inventory') multiple += 0.25;
  else if (model === 'Dropshipping') multiple -= 0.25;
  if (traffic === 'Mostly Organic') multiple += 0.5;
  else if (traffic === '100% Paid Ads') multiple -= 0.25;
  if (ownerHours < 5) multiple += 0.25;
  else if (ownerHours > 15) multiple -= 0.25;
  const valuation = sde * multiple + inventory;
  return Math.round(valuation);
}

export type TradeInput = {
  revenue: number;
  netProfit: number;
  ownerWage: number;
  addBacks: number;
  equipmentValue: number;
  vehicleValue?: number;
  debt?: number;
  recurring: boolean;
  staffCount: number;
  ownerInvolvement: 'Low' | 'Medium' | 'High';
  yearsInOperation: number;
  topClientRevenuePct?: number;
};

export function calculateTradeValuation(input: TradeInput): number {
  const {
    revenue,
    netProfit,
    ownerWage,
    addBacks,
    equipmentValue,
    vehicleValue = 0,
    debt = 0,
    recurring,
    staffCount,
    ownerInvolvement,
    yearsInOperation,
    topClientRevenuePct = 0
  } = input;
  const sde = netProfit + ownerWage + addBacks;
  let multiple = 2.0;
  if (recurring) multiple += 0.5;
  if (staffCount > 2) multiple += 0.25;
  if (ownerInvolvement === 'Low') multiple += 0.25;
  else if (ownerInvolvement === 'High') multiple -= 0.25;
  if (yearsInOperation > 5) multiple += 0.25;
  if ((topClientRevenuePct || 0) > 50) multiple -= 0.25;
  const valuation = sde * multiple + equipmentValue + vehicleValue - debt;
  return Math.round(valuation);
}

export type GenericInput = {
  revenue: number;
  netProfit: number;
  ownerWage?: number;
  addBacks?: number;
  assetValue?: number;
  debt?: number;
};

export function calculateGenericValuation(input: GenericInput): number {
  const {
    revenue,
    netProfit,
    ownerWage = 0,
    addBacks = 0,
    assetValue = 0,
    debt = 0
  } = input;
  const sde = netProfit + ownerWage + addBacks;
  let multiple = 2.5;
  if (revenue > 1000000) multiple += 0.5;
  if (revenue > 5000000) multiple += 1.0;
  if (sde > 250000) multiple += 0.25;
  const valuation = sde * multiple + assetValue - debt;
  return Math.round(valuation);
} 