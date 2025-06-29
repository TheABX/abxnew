'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function EnhancedValuationPage() {
  const [valuationType, setValuationType] = useState<'basic' | 'comprehensive'>('basic')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedSubCategory, setSelectedSubCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [valuationResult, setValuationResult] = useState<string | null>(null)
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null)
  const [valuationMethod, setValuationMethod] = useState<string | null>(null)
  
  // Base form data that all industries share
  const [baseFormData, setBaseFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    industry: '',
    yearsInOperation: '',
    location: '',
    reasonForValuation: ''
  })

  // Industry-specific form data
  const [industryFormData, setIndustryFormData] = useState<Record<string, any>>({})

  const industries = [
    'Trade Business',
    'E-commerce',
    'Technology',
    'Manufacturing',
    'Professional Services',
    'Retail',
    'Healthcare',
    'Food & Beverage',
    'Construction',
    'Transportation',
    'Education',
    'Real Estate',
    'Finance',
    'Other'
  ]

  const subCategories: Record<string, string[]> = {
    'Trade Business': ['Plumbing', 'Electrical', 'Building & Construction', 'HVAC', 'Landscaping', 'Painting', 'Roofing', 'Carpentry', 'Handyman', 'Pest Control', 'Cleaning'],
    'E-commerce': ['Fashion & Apparel', 'Electronics', 'Home Goods', 'Health & Beauty', 'Food & Beverage', 'Pet Supplies', 'Digital Products', 'Subscription Boxes', 'Dropshipping'],
    'Technology': ['SaaS', 'Mobile App', 'IT Services', 'Web Development & Design', 'Cybersecurity', 'AI & Machine Learning', 'Fintech', 'Edutech', 'Healthtech'],
    'Manufacturing': ['Food & Beverage', 'Clothing & Textiles', 'Furniture', 'Electronics', 'Machinery & Equipment', 'Chemical', 'Automotive Parts', 'Plastics & Rubber'],
    'Professional Services': ['Accounting & Bookkeeping', 'Legal Services', 'Marketing & Advertising', 'Consulting', 'Architecture & Engineering', 'Real Estate Services', 'Financial Advisory'],
    'Retail': ['Fashion Boutique', 'Cafe/Coffee Shop', 'Restaurant', 'Bar/Pub', 'Convenience Store', 'Specialty Food Store', 'Gift Shop', 'Bookstore', 'Hair & Beauty Salon'],
    'Healthcare': ['Medical Practice (GP)', 'Dental Clinic', 'Physiotherapy', 'Chiropractic', 'Pharmacy', 'Allied Health', 'Veterinary Clinic'],
    'Food & Beverage': ['Restaurant', 'Cafe', 'Bar/Pub', 'Catering', 'Food Truck', 'Bakery', 'Brewery/Distillery', 'Packaged Food Production'],
    'Construction': ['Residential Construction', 'Commercial Construction', 'Civil Engineering', 'Renovation & Remodeling', 'Architectural Services', 'Trade Services'],
    'Transportation': ['Logistics & Freight', 'Taxi & Ride-sharing', 'Trucking', 'Courier Services', 'Moving Services', 'Bus & Coach Services'],
    'Education': ['Childcare Centre', 'Tutoring Services', 'Registered Training Organisation (RTO)', 'Online Course Provider', 'Educational Resources'],
    'Real Estate': ['Sales Agency', 'Property Management', 'Buyer\'s Agency', 'Commercial Real Estate', 'Strata Management'],
    'Finance': ['Financial Planning/Advisory', 'Mortgage Broking', 'Insurance Broking', 'Accounting Firm', 'Bookkeeping Service'],
  }

  // E-commerce specific fields
  const ecommerceFields = {
    basic: [
      { name: 'annualRevenue', label: 'Annual Revenue ($)', type: 'number', required: true },
      { name: 'netProfit', label: 'Annual Net Profit (after expenses) ($)', type: 'number', required: true },
      { name: 'ownerAddBacks', label: 'Owner Add-Backs (personal expenses, owner wage, one-offs) ($)', type: 'number' },
      { name: 'businessModel', label: 'Business Model', type: 'select', options: ['Dropshipping', 'Own Inventory (warehouse or 3PL)', 'Subscription/Membership', 'Amazon FBA', 'Digital Product'], required: true },
      { name: 'trafficSource', label: 'Primary Traffic Source', type: 'select', options: ['100% Paid Ads', 'Mix of Paid & Organic', 'Mostly Organic'], required: true },
      { name: 'ownerInvolvement', label: 'Your Weekly Hours', type: 'select', options: ['< 5 hrs/week', '5-15 hrs/week', '15+ hrs/week'], required: true },
      { name: 'inventoryValue', label: 'Current Inventory Value (at cost) ($)', type: 'number' }
    ],
    comprehensive: [
      // Financial Inputs
      { name: 'revenue3Years', label: 'Revenue (Past 3 Years)', type: 'textarea', placeholder: 'Year 1: $X, Year 2: $Y, Year 3: $Z' },
      { name: 'grossProfit', label: 'Gross Profit ($)', type: 'number' },
      { name: 'netProfit', label: 'Net Profit ($)', type: 'number', required: true },
      { name: 'sde', label: 'Seller\'s Discretionary Earnings (SDE) ($)', type: 'number' },
      { name: 'adSpend', label: 'Monthly Ad Spend (Facebook, Google, etc.) ($)', type: 'number' },
      { name: 'cogs', label: 'Cost of Goods Sold (COGS) ($)', type: 'number' },
      { name: 'refundRate', label: 'Refund & Return Rate (%)', type: 'number' },
      { name: 'inventoryValue', label: 'Inventory Value on Hand ($)', type: 'number' },
      
      // Product & Fulfillment
      { name: 'numberOfSKUs', label: 'Number of SKUs', type: 'number' },
      { name: 'topProducts', label: 'Top-Selling Products (% of revenue)', type: 'text' },
      { name: 'fulfillmentModel', label: 'Fulfillment Model', type: 'select', options: ['In-house', '3PL', 'Dropshipping'] },
      { name: 'avgFulfillmentCost', label: 'Average Fulfillment Cost per Order ($)', type: 'number' },
      { name: 'shippingLocations', label: 'Shipping Locations', type: 'select', options: ['Domestic Only', 'International', 'Both'] },
      
      // Traffic & Marketing
      { name: 'monthlyVisitors', label: 'Monthly Website Visitors', type: 'number' },
      { name: 'trafficSplit', label: 'Paid vs Organic Traffic Split (%)', type: 'text', placeholder: 'e.g., 70% Paid, 30% Organic' },
      { name: 'acquisitionChannels', label: 'Main Acquisition Channels', type: 'text', placeholder: 'e.g., Facebook, SEO, TikTok' },
      { name: 'emailListSize', label: 'Email List Size', type: 'number' },
      { name: 'emailOpenRate', label: 'Email Open Rate (%)', type: 'number' },
      { name: 'cac', label: 'Customer Acquisition Cost (CAC) ($)', type: 'number' },
      { name: 'roas', label: 'Return on Ad Spend (ROAS)', type: 'number' },
      { name: 'mer', label: 'Marketing Efficiency Ratio (MER)', type: 'number' },
      
      // Customer Metrics
      { name: 'ordersPerMonth', label: 'Number of Orders per Month', type: 'number' },
      { name: 'aov', label: 'Average Order Value (AOV) ($)', type: 'number' },
      { name: 'ltv', label: 'Customer Lifetime Value (LTV) ($)', type: 'number' },
      { name: 'repeatPurchaseRate', label: 'Repeat Purchase Rate (%)', type: 'number' },
      { name: 'conversionRate', label: 'Conversion Rate (%)', type: 'number' },
      
      // Brand & Digital Assets
      { name: 'domainAuthority', label: 'Domain Authority Score', type: 'number' },
      { name: 'socialFollowing', label: 'Social Media Following', type: 'text' },
      { name: 'techStack', label: 'Tech Stack (e.g., Shopify, Klaviyo)', type: 'text' },
      { name: 'automationSystems', label: 'SOPs and Automation Systems', type: 'textarea' },
      
      // Growth & Risk Factors
      { name: 'yoyGrowthRate', label: 'Year-over-Year Growth Rate (%)', type: 'number' },
      { name: 'marketTrends', label: 'Market Trends', type: 'select', options: ['Growing Niche', 'Stable Market', 'Declining Niche'] },
      { name: 'keyPersonRisk', label: 'Key Person Risk Level', type: 'select', options: ['Low - Business runs without owner', 'Medium - Some owner involvement needed', 'High - Owner is irreplaceable'] },
      { name: 'supplyChainReliability', label: 'Supply Chain Reliability', type: 'select', options: ['Very Reliable', 'Mostly Reliable', 'Some Issues', 'Unreliable'] }
    ]
  }

  // Trade business specific fields
  const tradeFields = {
    basic: [
      { name: 'annualRevenue', label: 'Annual Revenue ($)', type: 'number', required: true },
      { name: 'netProfit', label: 'Net Profit (before owner\'s wage if applicable) ($)', type: 'number', required: true },
      { name: 'ownerWage', label: 'Owner\'s Wage (if included in net profit) ($)', type: 'number' },
      { name: 'equipmentValue', label: 'Estimated Value of Equipment/Tools ($)', type: 'number' },
      { name: 'numberOfStaff', label: 'Number of Staff (excluding owner)', type: 'number' },
      { name: 'recurringRevenue', label: 'Recurring Revenue?', type: 'select', options: ['Yes', 'No'] },
      { name: 'ownerInvolvement', label: 'Owner Involvement', type: 'select', options: ['Low', 'Medium', 'High'], required: true },
      { name: 'customerBreakdown', label: 'Customer Type Breakdown', type: 'text', placeholder: 'e.g., 80% residential / 20% commercial' }
    ],
    comprehensive: [
      // Financial Inputs
      { name: 'revenue3Years', label: 'Revenue (Past 3 Years)', type: 'textarea', placeholder: 'Year 1: $X, Year 2: $Y, Year 3: $Z', required: true },
      { name: 'profit3Years', label: 'Net Profit (Past 3 Years)', type: 'textarea', placeholder: 'Year 1: $X, Year 2: $Y, Year 3: $Z', required: true },
      { name: 'ownerWage', label: 'Owner\'s Wage/Drawings ($)', type: 'number' },
      { name: 'addBacks', label: 'Add-backs (personal expenses, once-offs) ($)', type: 'number' },
      { name: 'ebitda', label: 'EBITDA or SDE (if calculated) ($)', type: 'number' },
      { name: 'inventoryValue', label: 'Inventory Value on Hand ($)', type: 'number' },
      { name: 'equipmentValue', label: 'Estimated Equipment/Tool Value ($)', type: 'number' },
      { name: 'vehicleValue', label: 'Vehicle Value ($)', type: 'number' },
      { name: 'businessDebts', label: 'Business Debts/Liabilities ($)', type: 'number' },
      
      // Operational Inputs
      { name: 'fullTimeStaff', label: 'Number of Full-time Staff', type: 'number' },
      { name: 'subcontractors', label: 'Number of Subcontractors', type: 'number' },
      { name: 'ownerHours', label: 'Owner\'s Weekly Hours', type: 'number' },
      { name: 'ownerResponsibilities', label: 'Owner\'s Key Responsibilities', type: 'textarea' },
      { name: 'jobTypes', label: 'Job Types (% residential/commercial/maintenance)', type: 'text' },
      { name: 'systemsSoftware', label: 'Systems/Software Used (e.g., ServiceM8, SimPRO)', type: 'text' },
      
      // Client & Contract Inputs
      { name: 'activeCustomers', label: 'Number of Active Customers', type: 'number' },
      { name: 'repeatClients', label: '% of Revenue from Repeat/Contract Clients', type: 'number' },
      { name: 'longTermContracts', label: 'Details of Long-term Contracts', type: 'textarea' },
      { name: 'clientConcentration', label: '% of Revenue from Top 3 Clients', type: 'number' },
      
      // Business Structure
      { name: 'premises', label: 'Premises', type: 'select', options: ['Owned', 'Leased', 'Home-based'] },
      { name: 'entityType', label: 'Entity Type', type: 'select', options: ['Sole Trader', 'Partnership', 'Pty Ltd', 'Trust'] },
      { name: 'reasonForSale', label: 'Reason for Sale', type: 'textarea' }
    ]
  }

  // Generic fields for other industries
  const genericFields = {
    basic: [
      { name: 'annualRevenue', label: 'Annual Revenue ($)', type: 'number', required: true },
      { name: 'netProfit', label: 'Net Profit ($)', type: 'number', required: true },
      { name: 'numberOfEmployees', label: 'Number of Employees', type: 'number' },
      { name: 'ownerInvolvement', label: 'Owner Involvement', type: 'select', options: ['Low', 'Medium', 'High'], required: true },
      { name: 'assetValue', label: 'Estimated Asset Value ($)', type: 'number' },
      { name: 'recurringRevenue', label: 'Recurring Revenue?', type: 'select', options: ['Yes', 'No'] }
    ],
    comprehensive: [
      { name: 'revenue3Years', label: 'Revenue (Past 3 Years)', type: 'textarea', placeholder: 'Year 1: $X, Year 2: $Y, Year 3: $Z', required: true },
      { name: 'profit3Years', label: 'Net Profit (Past 3 Years)', type: 'textarea', placeholder: 'Year 1: $X, Year 2: $Y, Year 3: $Z', required: true },
      { name: 'numberOfEmployees', label: 'Number of Employees', type: 'number' },
      { name: 'ownerInvolvement', label: 'Owner Involvement', type: 'select', options: ['Low', 'Medium', 'High'], required: true },
      { name: 'assetValue', label: 'Estimated Asset Value ($)', type: 'number' },
      { name: 'recurringRevenue', label: 'Recurring Revenue Percentage (%)', type: 'number' },
      { name: 'customerBase', label: 'Number of Active Customers', type: 'number' },
      { name: 'marketPosition', label: 'Market Position', type: 'select', options: ['Market Leader', 'Strong Competitor', 'Niche Player', 'New Entrant'] },
      { name: 'growthRate', label: 'Annual Growth Rate (%)', type: 'number' },
      { name: 'keyRisks', label: 'Key Business Risks', type: 'textarea' },
      { name: 'competitiveAdvantages', label: 'Competitive Advantages', type: 'textarea' }
    ]
  }

  const getCurrentFields = () => {
    if (selectedIndustry === 'E-commerce') {
      return ecommerceFields[valuationType]
    } else if (selectedIndustry === 'Trade Business') {
      return tradeFields[valuationType]
    } else {
      return genericFields[valuationType]
    }
  }

  const handleBaseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBaseFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (name === 'industry') {
      setSelectedIndustry(value)
      setIndustryFormData({}) // Reset industry-specific data when industry changes
      setSelectedSubCategory('') // Reset sub-category when industry changes
    }
  }

  const handleIndustryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setIndustryFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const submissionData = {
        form_data: {
          ...baseFormData,
          industry: selectedIndustry,
          subCategory: selectedSubCategory,
          valuation_type: valuationType,
          industry_specific_data: industryFormData,
          submitted_at: new Date().toISOString()
        }
      }

      const { data, error } = await supabase
        .from('valuations')
        .insert([submissionData])

      if (error) {
        throw error
      }

      // Call API route to get valuation result
      const res = await fetch('/valuation/api', {
        method: 'POST',
        body: JSON.stringify({
          ...baseFormData,
          industry: selectedIndustry,
          subCategory: selectedSubCategory,
          valuation_type: valuationType,
          industry_specific_data: industryFormData,
          submitted_at: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const apiData = await res.json()
      setValuationResult(apiData.valuation || 'Error generating valuation')
      setCalculatedValue(apiData.calculatedValue)
      setValuationMethod(apiData.valuationMethod)

      // Save report data to localStorage and redirect
      localStorage.setItem('valuationResult', JSON.stringify(apiData))
      router.push('/valuation-backend')

      setMessage('Thank you! Your valuation request has been submitted successfully. We\'ll be in touch soon with your business valuation.')
      
      // Reset forms
      setBaseFormData({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        industry: '',
        yearsInOperation: '',
        location: '',
        reasonForValuation: ''
      })
      setIndustryFormData({})
      setSelectedIndustry('')
      setSelectedSubCategory('')
    } catch (error) {
      console.error('Error saving valuation:', error)
      setMessage('Error submitting valuation request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (field: any, value: any, onChange: any) => {
    const baseClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    
    switch (field.type) {
      case 'select':
        return (
          <select
            name={field.name}
            value={value || ''}
            onChange={onChange}
            required={field.required}
            className={baseClasses}
          >
            <option value="">Select an option</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={value || ''}
            onChange={onChange}
            required={field.required}
            placeholder={field.placeholder}
            rows={3}
            className={baseClasses}
          />
        )
      default:
        return (
          <input
            type={field.type || 'text'}
            name={field.name}
            value={value || ''}
            onChange={onChange}
            required={field.required}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Business Valuation Tool
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Get a professional estimate of your business value
          </p>
          
          {/* Valuation Type Toggle */}
          <div className="inline-flex bg-white rounded-lg p-1 shadow-md">
            <button
              type="button"
              onClick={() => setValuationType('basic')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                valuationType === 'basic'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quick Valuation (5 min)
            </button>
            <button
              type="button"
              onClick={() => setValuationType('comprehensive')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                valuationType === 'comprehensive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Comprehensive Analysis
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
              </label>
              <input
                type="text"
                name="name"
                    value={baseFormData.name}
                    onChange={handleBaseInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
              </label>
              <input
                type="email"
                name="email"
                    value={baseFormData.email}
                    onChange={handleBaseInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={baseFormData.phone}
                    onChange={handleBaseInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
              </label>
              <input
                    type="text"
                    name="businessName"
                    value={baseFormData.businessName}
                    onChange={handleBaseInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <select
                    name="industry"
                    value={baseFormData.industry}
                    onChange={handleBaseInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select your industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                {selectedIndustry && subCategories[selectedIndustry] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub-Category *
                    </label>
                    <select
                      name="subCategory"
                      value={selectedSubCategory}
                      onChange={(e) => setSelectedSubCategory(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select a sub-category</option>
                      {subCategories[selectedIndustry].map((subCategory) => (
                        <option key={subCategory} value={subCategory}>{subCategory}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years in Operation *
              </label>
              <input
                type="number"
                    name="yearsInOperation"
                    value={baseFormData.yearsInOperation}
                    onChange={handleBaseInputChange}
                required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter years in operation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={baseFormData.location}
                    onChange={handleBaseInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="City, State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Valuation
                  </label>
                  <select
                    name="reasonForValuation"
                    value={baseFormData.reasonForValuation}
                    onChange={handleBaseInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a reason</option>
                    <option value="Considering Sale">Considering Sale</option>
                    <option value="Estate Planning">Estate Planning</option>
                    <option value="Partnership Buyout">Partnership Buyout</option>
                    <option value="Insurance Purposes">Insurance Purposes</option>
                    <option value="Curiosity">Just Curious</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Industry-Specific Fields */}
            {selectedIndustry && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {selectedIndustry} Specific Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getCurrentFields().map((field) => (
                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && '*'}
                      </label>
                      {renderField(field, industryFormData[field.name], handleIndustryInputChange)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-800' 
                  : 'bg-green-50 border border-green-200 text-green-800'
              }`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading || !selectedIndustry || (subCategories[selectedIndustry] && !selectedSubCategory)}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Submitting Valuation Request...
                  </div>
                ) : (
                  `Get ${valuationType === 'basic' ? 'Quick' : 'Comprehensive'} Valuation`
                )}
              </button>
              
              {(!selectedIndustry || (subCategories[selectedIndustry] && !selectedSubCategory)) && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Please select an industry {subCategories[selectedIndustry] && 'and sub-category'} to continue
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">What Happens Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Analysis</h4>
              <p className="text-sm text-gray-600">Our experts analyze your business data using industry-specific valuation methods</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Report</h4>
              <p className="text-sm text-gray-600">Receive a detailed valuation report within 24-48 hours</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Consultation</h4>
              <p className="text-sm text-gray-600">Optional follow-up consultation to discuss your results and next steps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
