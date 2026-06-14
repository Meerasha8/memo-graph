import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, BookOpen, Baby, X, Loader2, Camera, Pencil, Trash2 } from 'lucide-react'

const SIZE_LABELS = {
  '1_month': '1 Month · 30 pages',
  '1_year_weekly': '1 Year — Weekly · 52 pages',
  '1_year_monthly': '1 Year — Monthly · 12 pages',
  'custom': 'Custom',
}

const RATIO_LABELS = {
  '9:16': 'Portrait 9:16',
  '16:9': 'Landscape 16:9',
  '1:1': 'Square 1:1',
  '4:3': 'Landscape 4:3',
  '3:4': 'Portrait 3:4',
}

const STATUS_COLORS = {
  draft: 'bg-[#FFE8D6] text-[#B66A4A]',
  complete: 'bg-[#E8F5EE] text-[#5C8B6E]',
  ordered: 'bg-[#5C8B6E] text-white',
}

export default function Books() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [children, setChildren] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showChildModal, setShowChildModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedChild, setSelectedChild] = useState(null)
  const [childForm, setChildForm] = useState({ name: '', date_of_birth: '' })
  const [bookForm, setBookForm] = useState({ title: '', size_type: '1_year_monthly', aspect_ratio: '9:16', child_id: '' })
  const [saving, setSaving] = useState(false)
  const [activeChildFilter, setActiveChildFilter] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: ch }, { data: bk }] = await Promise.all([
      supabase.from('children').select('*').order('created_at'),
      supabase.from('books').select('*, children(name)').order('created_at', { ascending: false }),
    ])
    setChildren(ch || [])
    setBooks(bk || [])
    setLoading(false)
  }

  const createChild = async () => {
    if (!childForm.name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('children').insert({ ...childForm, parent_id: user.id })
    if (!error) {
      if (typeof pendo !== 'undefined') {
        pendo.track('child_profile_created', {
          has_date_of_birth: Boolean(childForm.date_of_birth),
        })
      }
      setShowChildModal(false); setChildForm({ name: '', date_of_birth: '' }); fetchAll()
    }
    setSaving(false)
  }

  const createBook = async () => {
    if (!bookForm.title.trim()) return
    setSaving(true)
    const pageCount = { '1_month': 30, '1_year_weekly': 52, '1_year_monthly': 12, 'custom': bookForm.custom_page_count || 10 }[bookForm.size_type]
    const { data: book, error } = await supabase.from('books').insert({
      title: bookForm.title,
      size_type: bookForm.size_type,
      custom_page_count: pageCount,
      child_id: bookForm.child_id || null,
      parent_id: user.id,
    }).select().single()

    if (!error && book) {
      // Create front cover + pages with selected ratio
      const coverPage = { book_id: book.id, position: 0, canvas_data: { elements: [] }, aspect_ratio: bookForm.aspect_ratio }
      const pages = Array.from({ length: pageCount }, (_, i) => ({ book_id: book.id, position: i + 1, canvas_data: { elements: [] }, aspect_ratio: bookForm.aspect_ratio }))
      await supabase.from('pages').insert([coverPage, ...pages])
      if (typeof pendo !== 'undefined') {
        pendo.track('book_created', {
          size_type: bookForm.size_type,
          page_count: pageCount,
          aspect_ratio: bookForm.aspect_ratio,
          has_child_assigned: Boolean(bookForm.child_id),
        })
      }
      navigate(`/books/${book.id}`)
    }
    setSaving(false)
  }

  const deleteBook = async (e, bookId) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm('Delete this book?')) return
    await supabase.from('books').delete().eq('id', bookId)
    if (typeof pendo !== 'undefined') {
      pendo.track('book_deleted', {
        book_id: bookId,
      })
    }
    fetchAll()
  }

  const filteredBooks = activeChildFilter
    ? books.filter(b => b.child_id === activeChildFilter)
    : books

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={24} className="animate-spin text-[#B66A4A]" /></div>

  return (
    <div className="min-h-screen bg-[#FFFFF0]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-semibold text-[#2C1810] mb-1">My Memory Books</h1>
            <p className="text-[#6B4C3B] text-sm">A keepsake for every chapter of childhood.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowChildModal(true)} className="flex items-center gap-2 border border-[#FFCBA4]/60 bg-white text-[#6B4C3B] px-4 py-2.5 rounded-full text-sm font-medium hover:bg-[#FFE8D6]/40 transition-colors">
              <Plus size={16} /> Add child
            </button>
            <button onClick={() => setShowBookModal(true)} className="flex items-center gap-2 bg-[#B66A4A] text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-[#8C4F34] transition-colors">
              <BookOpen size={16} /> New book
            </button>
          </div>
        </div>

        {/* Child filter chips */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <button onClick={() => setActiveChildFilter(null)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeChildFilter ? 'bg-[#B66A4A] text-white' : 'bg-white border border-[#FFCBA4]/60 text-[#6B4C3B] hover:bg-[#FFE8D6]/40'}`}>
              All
            </button>
            {children.map(c => (
              <button key={c.id} onClick={() => setActiveChildFilter(c.id === activeChildFilter ? null : c.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeChildFilter === c.id ? 'bg-[#B66A4A] text-white' : 'bg-white border border-[#FFCBA4]/60 text-[#6B4C3B] hover:bg-[#FFE8D6]/40'}`}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Books grid */}
        {filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-[#FFE8D6] rounded-2xl flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-[#B66A4A]" />
            </div>
            <h3 className="font-display text-xl font-semibold text-[#2C1810] mb-2">No books yet</h3>
            <p className="text-[#6B4C3B] text-sm mb-6">Create your first memory book to get started.</p>
            <button onClick={() => setShowBookModal(true)} className="bg-[#B66A4A] text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#8C4F34] transition-colors">
              Create a book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => (
              <Link key={book.id} to={`/books/${book.id}`} className="group bg-white rounded-2xl border border-[#FFCBA4]/40 overflow-hidden hover:shadow-md hover:border-[#B66A4A]/30 transition-all">
                <div className="h-44 bg-gradient-to-br from-[#FFE8D6] to-[#E8F5EE] flex items-center justify-center relative">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} className="w-full h-full object-cover" alt={book.title} />
                  ) : (
                    <BookOpen size={40} className="text-[#B66A4A]/50" />
                  )}
                  <button onClick={(e) => deleteBook(e, book.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/80 rounded-lg hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={14} className="text-[#6B4C3B] hover:text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-display font-semibold text-[#2C1810] truncate">{book.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 capitalize ${STATUS_COLORS[book.status] || STATUS_COLORS.draft}`}>{book.status === 'ordered' ? 'Ordered' : book.status.charAt(0).toUpperCase() + book.status.slice(1)}</span>
                  </div>
                  <p className="text-[#6B4C3B] text-xs">{SIZE_LABELS[book.size_type]}{book.aspect_ratio ? ` · ${RATIO_LABELS[book.aspect_ratio] || book.aspect_ratio}` : ''} {book.children?.name ? `· ${book.children.name}` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {showChildModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold text-[#2C1810]">Add a child</h2>
              <button onClick={() => setShowChildModal(false)} className="text-[#6B4C3B] hover:text-[#2C1810]"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Name</label>
                <input value={childForm.name} onChange={e => setChildForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#FFCBA4]/60 rounded-xl px-4 py-3 text-sm bg-[#FFFFF0] focus:outline-none focus:ring-2 focus:ring-[#5C8B6E]/40"
                  placeholder="Child's name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Date of birth</label>
                <input type="date" value={childForm.date_of_birth} onChange={e => setChildForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  className="w-full border border-[#FFCBA4]/60 rounded-xl px-4 py-3 text-sm bg-[#FFFFF0] focus:outline-none focus:ring-2 focus:ring-[#5C8B6E]/40" />
              </div>
              <button onClick={createChild} disabled={saving} className="w-full bg-[#B66A4A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#8C4F34] transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : 'Add child'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold text-[#2C1810]">New memory book</h2>
              <button onClick={() => setShowBookModal(false)} className="text-[#6B4C3B] hover:text-[#2C1810]"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Title</label>
                <input value={bookForm.title} onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-[#FFCBA4]/60 rounded-xl px-4 py-3 text-sm bg-[#FFFFF0] focus:outline-none focus:ring-2 focus:ring-[#5C8B6E]/40"
                  placeholder="e.g. Riya's First Year" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">For</label>
                <select value={bookForm.child_id} onChange={e => setBookForm(f => ({ ...f, child_id: e.target.value }))}
                  className="w-full border border-[#FFCBA4]/60 rounded-xl px-4 py-3 text-sm bg-[#FFFFF0] focus:outline-none focus:ring-2 focus:ring-[#5C8B6E]/40">
                  <option value="">— No child selected —</option>
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Book size</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '1_month', label: '1 Month', sub: '30 pages' },
                    { value: '1_year_weekly', label: '1 Year Weekly', sub: '52 pages' },
                    { value: '1_year_monthly', label: '1 Year Monthly', sub: '12 pages' },
                    { value: 'custom', label: 'Custom', sub: 'You choose' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setBookForm(f => ({ ...f, size_type: opt.value }))}
                      className={`p-3 rounded-xl border text-left transition-all ${bookForm.size_type === opt.value ? 'border-[#5C8B6E] bg-[#E8F5EE]' : 'border-[#FFCBA4]/60 hover:border-[#B66A4A]/40'}`}>
                      <p className="text-sm font-medium text-[#2C1810]">{opt.label}</p>
                      <p className="text-xs text-[#6B4C3B]">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Page ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '9:16', label: 'Portrait 9:16' },
                    { value: '16:9', label: 'Landscape 16:9' },
                    { value: '1:1', label: 'Square 1:1' },
                    { value: '4:3', label: 'Landscape 4:3' },
                    { value: '3:4', label: 'Portrait 3:4' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setBookForm(f => ({ ...f, aspect_ratio: opt.value }))}
                      className={`p-3 rounded-xl border text-left transition-all ${bookForm.aspect_ratio === opt.value ? 'border-[#5C8B6E] bg-[#E8F5EE]' : 'border-[#FFCBA4]/60 hover:border-[#B66A4A]/40'}`}>
                      <p className="text-sm font-medium text-[#2C1810]">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              {bookForm.size_type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Page count</label>
                  <input type="number" min="1" max="200" value={bookForm.custom_page_count || ''} onChange={e => setBookForm(f => ({ ...f, custom_page_count: Number(e.target.value) }))}
                    className="w-full border border-[#FFCBA4]/60 rounded-xl px-4 py-3 text-sm bg-[#FFFFF0] focus:outline-none focus:ring-2 focus:ring-[#5C8B6E]/40"
                    placeholder="e.g. 20" />
                </div>
              )}
              <button onClick={createBook} disabled={saving} className="w-full bg-[#B66A4A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#8C4F34] transition-colors disabled:opacity-60">
                {saving ? 'Creating...' : 'Create book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
