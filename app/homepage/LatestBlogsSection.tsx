'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function LatestBlogsSection() {
  const [blogs, setBlogs] = useState<any[]>([])
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchBlogs() {
      const { data, error } = await supabase
        .from('blogs')
        .select('id,slug,title,image_url,readTime')
        .order('published_at', { ascending: false })

      if (error) {
        console.error('Error fetching blogs:', error)
      } else {
        setBlogs(data || [])
      }
    }
    fetchBlogs()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft
        setShowLeftArrow(scrollLeft > 0)
      }
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      // Check initial scroll position
      handleScroll()
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Latest Business News</h2>
        </header>
        
        {/* Navigation and Scroll Container */}
        <div className="relative">
          {/* Left Arrow - Conditionally rendered */}
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
              aria-label="Scroll left"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
            aria-label="Scroll right"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide px-4 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {blogs.map((blog) => (
              <a
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 w-80 md:w-96"
              >
                <img
                  src={blog.image_url}
                  alt={blog.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-black text-lg font-semibold line-clamp-2 mb-2">{blog.title}</h3>
                  <p className="text-gray-600 text-sm">{blog.readTime} min read</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Hide scrollbar for webkit browsers */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  )
} 