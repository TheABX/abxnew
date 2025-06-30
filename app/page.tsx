'use client'
// Last updated: December 2024 - Homepage with AI-powered business search and lead capture

import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'
import LatestBlogsSection from './homepage/LatestBlogsSection'

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
                  className="flex flex-col space-y-4 overflow-y-auto max-h-[300px]">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      {showLeadForm && (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Get Exclusive Listings</h2>
          <form onSubmit={handleLeadSubmit} className="space-y-4">
            <input
              type="text"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Name"
              className="w-full p-2 border rounded-md"
            />
            <input
              type="email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-2 border rounded-md"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
          {submitMessage && (
            <p className="mt-2 text-red-500">{submitMessage}</p>
          )}
        </div>
      )}
    </div>
  )
} 