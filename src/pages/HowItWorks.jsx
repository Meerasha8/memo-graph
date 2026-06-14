import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, BookOpen, Camera, Package, Palette, Star, Shield, Truck, ArrowRight } from 'lucide-react'

export default function HowItWorks() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#FFFFF0]">
      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-5xl font-semibold text-[#2C1810] mb-4">How Memo Graph works</h1>
          <p className="text-[#6B4C3B] text-lg leading-relaxed">From your phone's camera roll to a beautifully printed keepsake — here's how it all comes together.</p>
        </div>
      </section>

      {/* Steps detailed */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            {
              num: '01', icon: Heart, title: 'Create your child\'s profile',
              desc: 'Start by adding your child\'s name, birthday, and a photo. You can have multiple children and create separate books for each one.',
              tips: ['You can add multiple children', 'Child profiles help you stay organised', 'Edit or update details anytime'],
              color: 'bg-[#FFE8D6]', iconColor: 'text-[#B66A4A]',
            },
            {
              num: '02', icon: BookOpen, title: 'Choose a book size',
              desc: 'Pick the scope of your memory book. Whether it\'s capturing a single special month or an entire year of growth, we have the right format.',
              tips: ['1 Month — 30 pages, perfect for newborns', '1 Year Weekly — 52 pages, one per week', '1 Year Monthly — 12 rich spreads', 'Custom — you set the page count'],
              color: 'bg-[#E8F5EE]', iconColor: 'text-[#5C8B6E]',
            },
            {
              num: '03', icon: Palette, title: 'Design each page freely',
              desc: 'Our canvas editor lets you drag and drop photos, add text in any size or style, and position everything exactly where you want it. Every page is a blank canvas.',
              tips: ['Drag photos anywhere on the page', 'Double-click text to edit it', 'Resize elements with the corner handle', 'Save often with the Save button'],
              color: 'bg-[#FFF0E8]', iconColor: 'text-[#B66A4A]',
            },
            {
              num: '04', icon: Package, title: 'Order your printed album',
              desc: 'Choose your print quality, enter your delivery address, and pay securely with Razorpay. Your book will be printed and delivered to your door.',
              tips: ['Standard — matte, soft cover ₹499', 'Premium — glossy hardcover ₹899', 'Luxury — gold foil hardcover ₹1,499', 'Delivered across India'],
              color: 'bg-[#F0EBE8]', iconColor: 'text-[#6B4C3B]',
            },
          ].map(({ num, icon: Icon, title, desc, tips, color, iconColor }) => (
            <div key={num} className={`${color} rounded-2xl p-8 flex flex-col sm:flex-row gap-6`}>
              <div className="shrink-0">
                <div className="w-14 h-14 bg-white/70 rounded-2xl flex items-center justify-center shadow-sm">
                  <Icon size={24} className={iconColor} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-[#6B4C3B]/50 tracking-widest">{num}</span>
                  <h3 className="font-display text-2xl font-semibold text-[#2C1810]">{title}</h3>
                </div>
                <p className="text-[#6B4C3B] leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-1.5">
                  {tips.map(t => (
                    <li key={t} className="flex items-start gap-2 text-sm text-[#6B4C3B]">
                      <span className="text-[#B66A4A] mt-0.5">·</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Memo Graph */}
      <section className="bg-[#FFE8D6]/40 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-[#2C1810] text-center mb-12">Why parents love Memo Graph</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Star, title: 'Quality you can feel', desc: 'Premium paper stocks, vivid printing, and sturdy hardcovers built to last generations.' },
              { icon: Shield, title: 'Your photos, your privacy', desc: 'All images are stored securely in your private account. Only you can access your memories.' },
              { icon: Truck, title: 'Delivered across India', desc: 'We print and ship to every corner of India. Track your order status in the app.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Icon size={22} className="text-[#B66A4A]" />
                </div>
                <h3 className="font-display font-semibold text-[#2C1810] mb-2">{title}</h3>
                <p className="text-[#6B4C3B] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-[#2C1810] text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How long does printing and delivery take?', a: 'Typically 5–8 business days after payment. We\'ll send you a confirmation email with tracking once your book ships.' },
              { q: 'Can I edit a book after placing an order?', a: 'Once ordered, the book is sent to print and can no longer be edited. Make sure you\'re happy with every page before ordering!' },
              { q: 'What image formats are supported?', a: 'We support JPG, PNG, WEBP, and HEIC. For best print quality, use photos that are at least 1MB.' },
              { q: 'Can I order more than one copy?', a: 'Yes! You can increase the quantity when placing your order. All copies print from the same design.' },
              { q: 'Is my payment secure?', a: 'All payments are processed by Razorpay, a trusted and RBI-regulated payment gateway. We never store your card details.' },
              { q: 'Can I create books for multiple children?', a: 'Absolutely. You can add as many child profiles as you like and create a separate collection of books for each one.' },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white border border-[#FFCBA4]/40 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-medium text-[#2C1810] text-sm pr-4">{q}</span>
                  <span className="text-[#B66A4A] shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-[#6B4C3B] leading-relaxed border-t border-[#FFCBA4]/30 pt-4">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#B66A4A] py-20 px-6 text-center">
        <h2 className="font-display text-4xl font-semibold text-white mb-4">Ready to start?</h2>
        <p className="text-white/80 mb-8 text-lg">Your child's story is waiting to be told.</p>
        <Link
          to={user ? '/books' : '/signup'}
          className="inline-flex items-center gap-2 bg-white text-[#B66A4A] px-8 py-4 rounded-full font-semibold hover:bg-[#FFFFF0] transition-all hover:shadow-lg"
        >
          {user ? 'Go to my books' : 'Create your account'} <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}
