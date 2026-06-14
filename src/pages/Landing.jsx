import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, Camera, BookOpen, Package, Star, ArrowRight } from 'lucide-react'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#FFFFF0]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#FFCBA4]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#93C572]/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#FFE8D6] text-[#B66A4A] text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Heart size={14} fill="currentColor" /> Made with love, printed with care
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#2C1810] leading-tight mb-4">
            Every moment
          </h1>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#B66A4A] italic leading-tight mb-8">
            deserves a page.
          </h1>
          <p className="text-[#6B4C3B] text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Memo Graph turns the everyday — first laughs, scraped knees, sleepy Sundays — into a keepsake your child will hold forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={user ? '/books' : '/signup'}
              className="inline-flex items-center gap-2 bg-[#B66A4A] text-white px-8 py-4 rounded-full font-semibold text-base hover:bg-[#8C4F34] transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Start your first book <ArrowRight size={18} />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 border-2 border-[#5C8B6E] text-[#5C8B6E] px-8 py-4 rounded-full font-semibold text-base hover:bg-[#5C8B6E] hover:text-white transition-all"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-[#FFE8D6]/40 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-semibold text-[#2C1810] mb-3">A storybook journey</h2>
            <p className="text-[#6B4C3B]">From the first photo to the printed page.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, num: '1', title: 'Create a child profile', desc: "Add your little one's name, birthday, and a sweet photo.", color: 'bg-[#FFE8D6]' },
              { icon: BookOpen, num: '2', title: 'Build your memory book', desc: 'Pick a size — a month, a year, or your own custom journey.', color: 'bg-[#E8F5EE]' },
              { icon: Camera, num: '3', title: 'Add pages with photos & quotes', desc: 'Drag, drop, write a memory — design freely on a canvas.', color: 'bg-[#FFF9F0]' },
              { icon: Package, num: '4', title: 'Order a printed album', desc: 'Hardcover. Premium paper. Delivered to your door.', color: 'bg-[#F0EBE8]' },
            ].map(({ icon: Icon, num, title, desc, color }) => (
              <div key={num} className={`${color} rounded-2xl p-6 relative shadow-sm hover:shadow-md transition-shadow`}>
                <div className="absolute top-4 right-4 w-8 h-8 bg-[#B66A4A] rounded-full flex items-center justify-center text-white font-bold text-sm">{num}</div>
                <Icon size={24} className="text-[#B66A4A] mb-4" />
                <h3 className="font-display font-semibold text-[#2C1810] text-lg mb-2">{title}</h3>
                <p className="text-[#6B4C3B] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Book sizes */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-semibold text-[#2C1810] mb-3">Pick a book size</h2>
            <p className="text-[#6B4C3B]">Capture a season, a year, or anything in between.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { size: '1 Month', pages: '30 pages', desc: 'Perfect for a newborn\'s first month.' },
              { size: '1 Year — Weekly', pages: '52 pages', desc: 'One per week. Watch a whole year unfold.' },
              { size: '1 Year — Monthly', pages: '12 pages', desc: '12 generous monthly spreads of growth and milestones.' },
              { size: 'Custom', pages: 'Your count', desc: 'Pick your own page count. From birthdays to first trips.' },
            ].map(({ size, pages, desc }) => (
              <div key={size} className="border border-[#FFCBA4]/60 rounded-2xl p-6 hover:border-[#B66A4A] hover:shadow-sm transition-all group cursor-pointer">
                <div className="w-8 h-8 border-2 border-[#5C8B6E] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5C8B6E] transition-colors">
                  <div className="w-3 h-3 border-t-2 border-r-2 border-[#5C8B6E] group-hover:border-white rotate-45 translate-x-[-1px]" />
                </div>
                <h3 className="font-display font-semibold text-[#2C1810] text-xl mb-1">{size}</h3>
                <p className="text-[#B66A4A] text-sm font-medium mb-2">{pages}</p>
                <p className="text-[#6B4C3B] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#FFE8D6]/40 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-semibold text-[#2C1810] mb-3">Print quality</h2>
            <p className="text-[#6B4C3B]">From bedside keepsake to heirloom album.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Standard', price: '₹499', features: ['Matte finish', '150gsm paper', 'Soft cover'], accent: '#FFCBA4', popular: false },
              { name: 'Premium', price: '₹899', features: ['Glossy finish', '200gsm paper', 'Hardcover'], accent: '#93C572', popular: true },
              { name: 'Luxury', price: '₹1,499', features: ['Premium glossy', '250gsm paper', 'Hardcover + Gold foil title'], accent: '#B66A4A', popular: false },
            ].map(({ name, price, features, accent, popular }) => (
              <div key={name} className={`bg-white rounded-2xl p-6 shadow-sm ${popular ? 'ring-2 ring-[#5C8B6E] relative' : 'border border-[#FFCBA4]/40'}`}>
                {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5C8B6E] text-white text-xs font-semibold px-3 py-1 rounded-full">Most loved</div>}
                <div className="w-8 h-1 rounded-full mb-5" style={{ background: accent }} />
                <h3 className="font-display text-2xl font-semibold text-[#2C1810] mb-1">{name}</h3>
                <p className="text-[#B66A4A] text-3xl font-bold mb-5">{price}</p>
                <ul className="space-y-2">
                  {features.map(f => <li key={f} className="text-[#6B4C3B] text-sm flex items-center gap-2"><span className="text-[#B66A4A]">·</span>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to={user ? '/books' : '/signup'} className="inline-flex items-center gap-2 bg-[#B66A4A] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#8C4F34] transition-all hover:shadow-lg">
              Get started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center border-t border-[#FFCBA4]/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen size={16} className="text-[#B66A4A]" />
          <span className="font-display font-semibold text-[#2C1810]">Memo Graph</span>
        </div>
        <p className="text-[#6B4C3B] text-sm">© 2026 Memo Graph. All rights reserved.</p>
      </footer>
    </div>
  )
}
