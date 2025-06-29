'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import LatestBlogsSection from './LatestBlogsSection'

// Define the types for our data structures
interface Listing {
  id: string;
  businessName: string;
  location: string;
  price: string;
  revenue?: string;
  teaserDescription: string;
  isAiGenerated?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  listings?: Listing[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // State for the lead capture form
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [showLeadForm, setShowLeadForm] = useState(false)

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter()

  useEffect(() => {
    // Remove the background image logic and set background to white
    document.body.classList.remove('homepage-background');
    setMessages([])
    return () => {
      document.body.classList.remove('homepage-background');
    };
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the chat container when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!res.ok) {
        throw new Error('Something went wrong. Please try again.')
      }
      
      const data = await res.json()
      
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.reply || '', // Ensure content is always a string
        listings: data.listings 
      }
      setMessages(prev => [...prev, assistantMessage])

      // If listings are returned, show the lead form
      if (data.listings && data.listings.length > 0) {
        setShowLeadForm(true)
      }

    } catch (err: any) {
      const errorMessage: Message = { role: 'assistant', content: err.message }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const { error } = await supabase
        .from('lead_signups')
        .insert([{ name: leadName, email: leadEmail }])

      if (error) {
        throw new Error(error.message)
      }
      
      setSubmitMessage('Thank you! We will be in touch with exclusive listings shortly.')
      setLeadName('')
      setLeadEmail('')
    } catch (err: any) {
      setSubmitMessage(`Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="block flex-shrink-0">
              <img 
                src="/logo1.png" 
                alt="ABX Logo" 
                className="h-24 md:h-28"
              />
            </a>
            {/* Navigation */}
            <div className="flex items-center gap-3">
              <button className="text-white text-sm font-medium hover:text-gray-300 transition-colors" onClick={() => router.push('/signin')}>
                Sign in
              </button>
              <button
                className="bg-[#FFA736] text-white text-sm font-semibold px-3 py-2 rounded-md shadow hover:bg-orange-500 transition-colors"
                onClick={() => router.push('/signup')}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner Section - Narrower, more focused layout */}
      <section
        className="w-full transition-all duration-300 flex flex-col items-center justify-center"
        style={{
          backgroundImage: "url('/dark_background_option_5.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '60vh',
        }}
      >
        {/* Narrower container for better readability */}
        <div className="max-w-4xl mx-auto px-6 w-full flex flex-col items-center text-center py-8 h-full">
          <div className={`flex flex-col items-center justify-center w-full h-full ${messages.length === 0 ? 'flex-1 justify-center' : ''}`}>
            {/* Refined typography with better hierarchy */}
            <div className="text-center py-6 max-w-3xl">
              <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Buy or sell your <br />Business in minutes
              </h1>
              <p className="text-gray-300 mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                Join thousands using Australia's most trusted platform to access off-market deals and sell faster with AI
              </p>
            </div>
            
            {/* Cleaner, more focused search interface */}
            <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col">
              <form onSubmit={handleSubmit} className="flex items-center mb-4 shadow-lg">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="plumbing business in sydney for 500k"
                  className="flex-grow px-4 py-3 rounded-l-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border-0"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-3 rounded-r-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  ↑
                </button>
              </form>
            </div>

            {/* Improved chat container with better styling - includes listings */}
            {messages.length > 0 && (
              <div className="w-full max-w-xl mx-auto mt-4">
                <div 
                  ref={chatContainerRef}
                  className="max-h-96 overflow-y-auto space-y-2 p-4 bg-black/10 backdrop-blur-md rounded-lg border border-white/20"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4B5563 transparent'
                  }}
                >
                  {messages
                    .filter(
                      (msg) =>
                        !(
                          msg.role === 'assistant' &&
                          msg.content === "Hi! I'm your expert business broker assistant. What kind of business are you looking for today?"
                        )
                    )
                    .map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-3 py-2 text-sm max-w-xs ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-900 shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  
                  {/* Display listings within the chat container */}
                  {messages
                    .filter(msg => msg.listings && msg.listings.length > 0)
                    .map((msg, index) => (
                      <div key={`listings-${index}`} className="mt-4">
                        {msg.listings && (
                          <div className="space-y-3">
                            {msg.listings.map(listing => (
                              <div key={listing.id} className="bg-white/95 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 mb-1">{listing.businessName}</h3>
                                <p className="text-xs text-gray-600 mb-1">{listing.location}</p>
                                <p className="text-sm font-semibold mb-1 text-gray-800">{listing.price}</p>
                                {listing.revenue && (
                                   <p className="text-sm font-semibold mb-1 text-gray-800">Revenue: {listing.revenue}</p>
                                )}
                                <p className="text-xs whitespace-pre-wrap text-gray-700 leading-relaxed">{listing.teaserDescription}</p>
                                {listing.isAiGenerated && (
                                  <p className="text-xs text-blue-500 mt-1 font-semibold">✨ AI-Generated Example</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-900 rounded-lg px-3 py-2 text-sm shadow-sm">
                        <span className="animate-pulse">...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Improved lead form - moved inside hero */}
            {showLeadForm && (
             <div className="my-6 p-6 bg-black/20 backdrop-blur-md rounded-xl w-full max-w-2xl mx-auto border border-white/20">
                {messages[messages.length - 1]?.listings?.[0]?.isAiGenerated ? (
                  <>
                    <h2 className="text-xl font-bold text-white mb-2">👉 Want to be notified when one becomes available?</h2>
                    <p className="text-gray-300 mb-4 text-sm">Enter your details, and we'll be the first to let you know when a matching listing goes live.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-white mb-2">Want to see more exclusive listings?</h2>
                    <p className="text-gray-300 mb-4 text-sm">Enter your details to unlock our off-market deals.</p>
                  </>
                )}
                
                {!submitMessage ? (
                  <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Your Name"
                      required
                      className="flex-grow px-3 py-2 rounded-md bg-white/90 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="Your Email"
                      required
                      className="flex-grow px-3 py-2 rounded-md bg-white/90 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-semibold text-sm transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : (messages[messages.length - 1]?.listings?.[0]?.isAiGenerated ? 'Notify Me' : 'Unlock Deals')}
                    </button>
                  </form>
                ) : (
                  <p className="text-green-400 text-base text-center font-medium">{submitMessage}</p>
                )}
             </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Main content area with narrower layout */}
      <div className="w-full bg-white flex-1">
        {/* Lead form - narrower container */}
        <div className="max-w-4xl mx-auto px-6 w-full">
          <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col">
            {/* Improved lead form */}
          </div>
        </div>

        {/* Improved Business Resources Section with narrower layout */}
        <section className="w-full bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <header className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Explore all things business buying</h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1 - Smaller, more refined */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 p-8 flex flex-col items-center text-center group h-full">
                <img src="/business-readiness-assessment.png" alt="Business Readiness Assessment" className="w-20 h-20 object-cover rounded-lg mb-6" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you ready to buy a business?</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">Take our comprehensive assessment to evaluate your preparedness and get personalized recommendations.</p>
                <button
                  className="text-blue-600 font-semibold underline hover:text-blue-800 transition-colors text-sm"
                  onClick={() => { router.push('/readiness-assessment'); }}
                  aria-label="Take readiness assessment"
                >
                  Take the assessment
                </button>
              </div>
              {/* Card 2 */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 p-8 flex flex-col items-center text-center group h-full">
                <img src="/business-financing-options.png" alt="Business Financing Options" className="w-20 h-20 object-cover rounded-lg mb-6" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help with business financing?</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">Explore financing options including SBA loans, seller financing, and alternative funding sources.</p>
                <button
                  className="text-blue-600 font-semibold underline hover:text-blue-800 transition-colors text-sm"
                  onClick={() => { router.push('/financing-options'); }}
                  aria-label="Explore financing options"
                >
                  Explore financing options
                </button>
              </div>
              {/* Card 3 */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 p-8 flex flex-col items-center text-center group h-full">
                <img src="/business-advisor-connection.png" alt="Business Advisor Connection" className="w-20 h-20 object-cover rounded-lg mb-6" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect with business advisors</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">Get expert guidance from experienced business brokers and industry specialists.</p>
                <button
                  className="text-blue-600 font-semibold underline hover:text-blue-800 transition-colors text-sm"
                  onClick={() => { router.push('/advisor-connection'); }}
                  aria-label="Connect with advisors"
                >
                  Connect with advisors
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Blogs Section */}
        <LatestBlogsSection />

        {/* Agent Login Banner */}
        <div className="bg-blue-600">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
            <img 
              src="/logo1.png" 
              alt="ABX Logo" 
              className="h-8 filter brightness-0 invert"
            />
            <button 
              className="flex items-center gap-2 bg-transparent border border-white text-white text-sm font-semibold px-3 py-1 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              onClick={() => router.push('/agent-admin')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              <span>Agent admin</span>
            </button>
          </div>
        </div>

        {/* Professional Footer Section */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="lg:col-span-1">
                <img 
                  src="/logo1.png" 
                  alt="ABX Logo" 
                  className="h-10 mb-4 filter brightness-0 invert"
                />
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Australia's most trusted platform for buying and selling businesses. Connect with thousands of verified buyers and sellers.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm">Quick Links</h3>
                <ul className="space-y-2">
                  <li><a href="/buy" className="text-gray-400 hover:text-white transition-colors text-sm">Buy a Business</a></li>
                  <li><a href="/sell" className="text-gray-400 hover:text-white transition-colors text-sm">Sell a Business</a></li>
                  <li><a href="/valuations" className="text-gray-400 hover:text-white transition-colors text-sm">Business Valuations</a></li>
                  <li><a href="/financing" className="text-gray-400 hover:text-white transition-colors text-sm">Financing Options</a></li>
                  <li><a href="/advisors" className="text-gray-400 hover:text-white transition-colors text-sm">Find Advisors</a></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors text-sm">Blog</a></li>
                  <li><a href="/guides" className="text-gray-400 hover:text-white transition-colors text-sm">Buying Guides</a></li>
                  <li><a href="/market-insights" className="text-gray-400 hover:text-white transition-colors text-sm">Market Insights</a></li>
                  <li><a href="/success-stories" className="text-gray-400 hover:text-white transition-colors text-sm">Success Stories</a></li>
                  <li><a href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">FAQ</a></li>
                </ul>
              </div>

              {/* Contact & Newsletter */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm">Stay Connected</h3>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">📞 1300 123 456</p>
                  <p className="text-gray-400 text-sm mb-1">✉️ hello@abx.com.au</p>
                  <p className="text-gray-400 text-sm">📍 Sydney, Australia</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Get weekly business insights</p>
                  <form className="flex">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="flex-grow px-3 py-2 bg-gray-800 text-white text-sm rounded-l-md border border-gray-700 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-3 py-2 rounded-r-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-xs">Privacy Policy</a>
                <a href="/terms" className="text-gray-400 hover:text-white transition-colors text-xs">Terms of Use</a>
                <a href="/sitemap" className="text-gray-400 hover:text-white transition-colors text-xs">Sitemap</a>
                <a href="/accessibility" className="text-gray-400 hover:text-white transition-colors text-xs">Accessibility</a>
              </div>
              <p className="text-gray-400 text-xs">© 2025 ABX. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .max-h-96::-webkit-scrollbar {
          width: 4px;
        }
        .max-h-96::-webkit-scrollbar-track {
          background: transparent;
        }
        .max-h-96::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 2px;
        }
        .max-h-96::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </div>
  )
}
 