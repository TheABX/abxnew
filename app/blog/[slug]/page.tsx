import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zjiwreyvamyeapjgvsam.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaXdyZXl2YW15ZWFwamd2c2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNzc1NTYsImV4cCI6MjA2NTg1MzU1Nn0.fUCRZnVuFTqBRGXJf9yfdWzBSHh8n0dnpL51OHusI7E'
)

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  const { data: blog, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !blog) {
    return <div className="p-10 text-center text-red-600">Blog post not found</div>
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{blog.title}</h1>
      <img
        src={blog.image_url}
        alt={blog.title}
        className="w-full h-64 object-cover rounded mb-6"
      />
      <div
        className="prose prose-lg"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </main>
  )
}
 