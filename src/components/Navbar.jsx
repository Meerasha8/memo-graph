import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Menu, X, LogOut, User } from 'lucide-react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const navLinks = user
    ? [
        { to: '/books', label: 'My Books' },
        { to: '/orders', label: 'My Orders' },
        { to: '/how-it-works', label: 'How It Works' },
      ]
    : [{ to: '/how-it-works', label: 'How It Works' }]

  return (
    <nav className="sticky top-0 z-50 bg-[#FFFFF0]/90 backdrop-blur-sm border-b border-[#FFCBA4]/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-[#B66A4A] flex items-center justify-center shadow-sm group-hover:bg-[#8C4F34] transition-colors">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="font-display font-semibold text-lg text-[#2C1810]">Memo Graph</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-[#B66A4A]' : 'text-[#6B4C3B] hover:text-[#B66A4A]'}`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-[#5C8B6E] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#3D6B52] transition-colors"
              >
                {user.email?.[0]?.toUpperCase() || 'U'}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-[#FFCBA4]/40 py-2 w-48 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-[#6B4C3B] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#B66A4A] hover:bg-[#FFE8D6] transition-colors"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-[#6B4C3B] hover:text-[#B66A4A] transition-colors">Sign in</Link>
              <Link to="/signup" className="text-sm font-medium bg-[#B66A4A] text-white px-4 py-2 rounded-full hover:bg-[#8C4F34] transition-colors">Get started</Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-[#6B4C3B]">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#FFFFF0] border-t border-[#FFCBA4]/40 px-4 py-4 flex flex-col gap-3">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[#6B4C3B] hover:text-[#B66A4A]">{l.label}</Link>
          ))}
          {user ? (
            <button onClick={handleSignOut} className="text-sm font-medium text-[#B66A4A] text-left">Sign out</button>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[#6B4C3B]">Sign in</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[#B66A4A]">Get started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
