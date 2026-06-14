import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Plus, Trash2, Type, Image as ImageIcon, ChevronLeft, ChevronRight,
  Save, ShoppingCart, Loader2, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  ZoomIn, ZoomOut, BookOpen, X, Upload, Check, ArrowLeft, Eye
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const CANVAS_W = 400

function getCanvasDimensions(ratio) {
  switch (ratio) {
    case '16:9':
      return { width: CANVAS_W, height: Math.round(CANVAS_W * 9 / 16) }
    case '1:1':
      return { width: CANVAS_W, height: CANVAS_W }
    case '4:3':
      return { width: CANVAS_W, height: Math.round(CANVAS_W * 3 / 4) }
    case '3:4':
      return { width: CANVAS_W, height: Math.round(CANVAS_W * 4 / 3) }
    case '9:16':
    default:
      return { width: CANVAS_W, height: Math.round(CANVAS_W * 16 / 9) }
  }
}

export default function BookEditor() {
  const { id: bookId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const [book, setBook] = useState(null)
  const [pages, setPages] = useState([])
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [elements, setElements] = useState([]) // current page elements
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [resizing, setResizing] = useState(null)
  const [zoom, setZoom] = useState(0.85)
  const [editingText, setEditingText] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [unsaved, setUnsaved] = useState(false)

  // Load book + pages
  useEffect(() => {
    const load = async () => {
      const { data: bookData } = await supabase.from('books').select('*, children(name)').eq('id', bookId).single()
      const { data: pagesData } = await supabase.from('pages').select('*').eq('book_id', bookId).order('position')
      setBook(bookData)
      setPages(pagesData || [])
      if (pagesData?.[0]) setElements(pagesData[0].canvas_data?.elements || [])
      setLoading(false)
    }
    load()
  }, [bookId])

  // Switch pages: save current, load new
  const switchPage = useCallback(async (newIdx) => {
    if (newIdx === currentPageIdx) return
    await saveCurrentPage()
    setCurrentPageIdx(newIdx)
    setElements(pages[newIdx]?.canvas_data?.elements || [])
    setSelectedId(null)
    setEditingText(null)
  }, [currentPageIdx, pages, elements])

  const saveCurrentPage = async () => {
    if (!pages[currentPageIdx]) return
    const pageId = pages[currentPageIdx].id
    await supabase.from('pages').update({ canvas_data: { elements } }).eq('id', pageId)
    setPages(prev => prev.map((p, i) => i === currentPageIdx ? { ...p, canvas_data: { elements } } : p))
  }

  const currentAspectRatio = pages[currentPageIdx]?.aspect_ratio || '9:16'
  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(currentAspectRatio)

  const saveAll = async () => {
    setSaving(true)
    await saveCurrentPage()
    setSaved(true)
    setUnsaved(false)
    if (typeof pendo !== 'undefined') {
      pendo.track('book_saved', {
        book_id: bookId,
        current_page_index: currentPageIdx,
        total_pages: pages.length,
        element_count: elements.length,
      })
    }
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  // Add text element
  const addText = () => {
    const el = { id: uuidv4(), type: 'text', text: 'Tap to edit', x: 50, y: 50, w: 300, h: 60, fontSize: 24, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left', color: '#2C1810', fontFamily: 'Inter' }
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
    setUnsaved(true)
  }

  // Add image element
  const addImage = () => fileInputRef.current?.click()

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${bookId}/${uuidv4()}.${ext}`
    const { data: uploadData, error } = await supabase.storage.from('book-images').upload(path, file)
    if (error) { alert('Upload failed: ' + error.message); return }

    // For private buckets, create a short-lived signed URL so the image can be displayed
    const { data: signedData, error: signErr } = await supabase.storage.from('book-images').createSignedUrl(path, 60 * 60)
    if (signErr) { alert('Failed to create image URL: ' + signErr.message); return }
    const publicUrl = signedData?.signedUrl || ''

    const el = { id: uuidv4(), type: 'image', src: publicUrl, x: 50, y: 100, w: 300, h: 200 }
    setElements(prev => [...prev, el])
    setSelectedId(el.id)
    setUnsaved(true)
    if (typeof pendo !== 'undefined') {
      pendo.track('image_uploaded', {
        file_extension: ext,
        page_position: currentPageIdx,
        is_cover_page: currentPageIdx === 0,
        book_id: bookId,
      })
    }
    e.target.value = ''
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setElements(prev => prev.filter(e => e.id !== selectedId))
    setSelectedId(null)
    setUnsaved(true)
  }

  const updateElement = (id, updates) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
    setUnsaved(true)
  }

  const selected = elements.find(e => e.id === selectedId)

  // Mouse drag/resize
  const onMouseDown = (e, el, type = 'drag') => {
    e.stopPropagation()
    if (type === 'resize') {
      setResizing({ id: el.id, startX: e.clientX, startY: e.clientY, startW: el.w, startH: el.h })
    } else {
      setDragging({ id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y })
    }
    setSelectedId(el.id)
    if (editingText && editingText !== el.id) setEditingText(null)
  }

  const onMouseMove = useCallback((e) => {
    const scale = zoom
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / scale
      const dy = (e.clientY - dragging.startY) / scale
      updateElement(dragging.id, { x: Math.max(0, dragging.origX + dx), y: Math.max(0, dragging.origY + dy) })
    }
    if (resizing) {
      const dx = (e.clientX - resizing.startX) / scale
      const dy = (e.clientY - resizing.startY) / scale
      updateElement(resizing.id, { w: Math.max(50, resizing.startW + dx), h: Math.max(30, resizing.startH + dy) })
    }
  }, [dragging, resizing, zoom])

  const onMouseUp = useCallback(() => {
    setDragging(null)
    setResizing(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [onMouseMove, onMouseUp])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={24} className="animate-spin text-[#B66A4A]" /></div>

  const currentPage = pages[currentPageIdx]
  const isFirstPage = currentPageIdx === 0

  return (
    <div className="flex h-screen bg-[#F5F0E8] overflow-hidden">
      {/* Left sidebar: pages */}
      <aside className="w-52 bg-[#FFFFF0] border-r border-[#FFCBA4]/40 flex flex-col shrink-0">
        <div className="p-3 border-b border-[#FFCBA4]/40">
          <Link to="/books" className="flex items-center gap-1.5 text-[#6B4C3B] text-sm hover:text-[#B66A4A] transition-colors">
            <ArrowLeft size={14} /> Books
          </Link>
          <h2 className="font-display font-semibold text-[#2C1810] text-sm mt-2 truncate">{book?.title}</h2>
          {book?.children?.name && <p className="text-xs text-[#6B4C3B]">{book.children.name}</p>}
        </div>

        <div className="p-2 border-b border-[#FFCBA4]/40">
          <p className="text-[10px] uppercase tracking-widest text-[#6B4C3B]/60 font-medium px-1 mb-2">Front Cover</p>
          <button onClick={() => switchPage(0)} className={`w-full rounded-lg overflow-hidden border-2 transition-all ${currentPageIdx === 0 ? 'border-[#B66A4A]' : 'border-transparent hover:border-[#FFCBA4]'}`}>
            <div className="w-full h-24 bg-gradient-to-br from-[#FFE8D6] to-[#E8F5EE] flex items-center justify-center">
              <BookOpen size={20} className="text-[#B66A4A]/50" />
            </div>
            <p className="text-[10px] text-center text-[#6B4C3B] py-1 bg-white">Cover</p>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-[10px] uppercase tracking-widest text-[#6B4C3B]/60 font-medium px-1 mb-2">Pages</p>
          {pages.slice(1).map((page, i) => (
            <button key={page.id} onClick={() => switchPage(i + 1)} className={`w-full mb-2 rounded-lg overflow-hidden border-2 transition-all ${currentPageIdx === i + 1 ? 'border-[#B66A4A]' : 'border-transparent hover:border-[#FFCBA4]'}`}>
              <div className="w-full h-20 bg-gradient-to-br from-[#FFF9F0] to-[#F0EBE8] flex items-center justify-center relative">
                {page.canvas_data?.elements?.filter(el => el.type === 'image').length > 0 ? (
                  <img src={page.canvas_data.elements.find(el => el.type === 'image')?.src} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-[10px] text-[#6B4C3B]/40">Empty</span>
                )}
              </div>
              <p className="text-[10px] text-center text-[#6B4C3B] py-1 bg-white">{i + 1}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top toolbar */}
        <div className="bg-[#FFFFF0] border-b border-[#FFCBA4]/40 px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2 border-r border-[#FFCBA4]/40 pr-4">
            <button onClick={addText} className="flex items-center gap-1.5 text-sm font-medium text-[#6B4C3B] hover:text-[#B66A4A] hover:bg-[#FFE8D6]/60 px-3 py-1.5 rounded-lg transition-colors">
              <Type size={16} /> Text
            </button>
            <button onClick={addImage} className="flex items-center gap-1.5 text-sm font-medium text-[#6B4C3B] hover:text-[#B66A4A] hover:bg-[#FFE8D6]/60 px-3 py-1.5 rounded-lg transition-colors">
              <ImageIcon size={16} /> Image
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Text formatting (visible when text selected) */}
          {selected?.type === 'text' && (
            <div className="flex items-center gap-1 border-r border-[#FFCBA4]/40 pr-4">
              <select value={selected.fontSize || 24} onChange={e => updateElement(selected.id, { fontSize: Number(e.target.value) })}
                className="text-xs border border-[#FFCBA4]/60 rounded-lg px-2 py-1.5 bg-[#FFFFF0] text-[#2C1810]">
                {[12,14,16,18,20,24,28,32,36,40,48,56,64].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => updateElement(selected.id, { fontWeight: selected.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`p-1.5 rounded-lg transition-colors ${selected.fontWeight === 'bold' ? 'bg-[#B66A4A] text-white' : 'hover:bg-[#FFE8D6]/60 text-[#6B4C3B]'}`}>
                <Bold size={14} />
              </button>
              <button onClick={() => updateElement(selected.id, { fontStyle: selected.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`p-1.5 rounded-lg transition-colors ${selected.fontStyle === 'italic' ? 'bg-[#B66A4A] text-white' : 'hover:bg-[#FFE8D6]/60 text-[#6B4C3B]'}`}>
                <Italic size={14} />
              </button>
              <div className="flex border border-[#FFCBA4]/60 rounded-lg overflow-hidden">
                {['left', 'center', 'right'].map(align => (
                  <button key={align} onClick={() => updateElement(selected.id, { textAlign: align })}
                    className={`p-1.5 transition-colors ${selected.textAlign === align ? 'bg-[#B66A4A] text-white' : 'hover:bg-[#FFE8D6]/60 text-[#6B4C3B]'}`}>
                    {align === 'left' ? <AlignLeft size={14} /> : align === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                  </button>
                ))}
              </div>
              <input type="color" value={selected.color || '#2C1810'} onChange={e => updateElement(selected.id, { color: e.target.value })}
                className="w-7 h-7 rounded-lg border border-[#FFCBA4]/60 cursor-pointer p-0.5" title="Text color" />
            </div>
          )}

          {selectedId && (
            <button onClick={deleteSelected} className="flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          )}

          <div className="flex-1" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-1.5 text-[#6B4C3B] hover:bg-[#FFE8D6]/60 rounded-lg"><ZoomOut size={14} /></button>
            <span className="text-xs text-[#6B4C3B] w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 text-[#6B4C3B] hover:bg-[#FFE8D6]/60 rounded-lg"><ZoomIn size={14} /></button>
          </div>

          <button onClick={saveAll} disabled={saving} className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${saved ? 'bg-[#E8F5EE] text-[#5C8B6E]' : 'bg-[#5C8B6E] text-white hover:bg-[#3D6B52]'} disabled:opacity-60`}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 text-sm font-semibold bg-white border border-[#E8E8E8] text-[#6B4C3B] px-4 py-1.5 rounded-lg hover:bg-[#FFE8D6]/40 transition-colors">
            <Eye size={14} /> Preview
          </button>
          <button onClick={async () => { await saveAll(); setShowOrderModal(true) }} className="flex items-center gap-1.5 text-sm font-semibold bg-[#B66A4A] text-white px-4 py-1.5 rounded-lg hover:bg-[#8C4F34] transition-colors">
            <ShoppingCart size={14} /> Order
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8"
          onClick={() => { setSelectedId(null); setEditingText(null) }}>
          <div
            ref={canvasRef}
            style={{ width: canvasWidth * zoom, height: canvasHeight * zoom, position: 'relative', background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', borderRadius: 8, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, background: isFirstPage ? 'linear-gradient(135deg, #FFE8D6, #E8F5EE)' : '#ffffff', border: '1px solid #E8E8E8', borderRadius: 6 }}>
              {elements.map(el => (
                <div
                  key={el.id}
                  onMouseDown={e => onMouseDown(e, el)}
                  style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, cursor: dragging?.id === el.id ? 'grabbing' : 'grab', border: selectedId === el.id ? '2px solid #5C8B6E' : '2px solid transparent', borderRadius: 4, userSelect: 'none' }}
                >
                  {el.type === 'image' && (
                    <img src={el.src} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, pointerEvents: 'none', display: 'block' }} alt="" draggable={false} />
                  )}
                  {el.type === 'text' && (
                    editingText === el.id ? (
                      <textarea
                        autoFocus
                        value={el.text}
                        onChange={e => { e.stopPropagation(); updateElement(el.id, { text: e.target.value }) }}
                        onBlur={() => setEditingText(null)}
                        style={{ width: '100%', height: '100%', fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textAlign: el.textAlign, color: el.color, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: el.fontFamily || 'Inter', padding: 4, lineHeight: 1.3 }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                      />
                    ) : (
                      <div
                        onDoubleClick={e => { e.stopPropagation(); setEditingText(el.id) }}
                        style={{ width: '100%', height: '100%', fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textAlign: el.textAlign, color: el.color, fontFamily: el.fontFamily || 'Inter', padding: 4, lineHeight: 1.3, wordBreak: 'break-word', overflow: 'hidden', whiteSpace: 'pre-wrap' }}
                      >
                        {el.text}
                      </div>
                    )
                  )}
                  {selectedId === el.id && !editingText && (
                    <div onMouseDown={e => onMouseDown(e, el, 'resize')} style={{ position: 'absolute', bottom: -5, right: -5, width: 12, height: 12, background: '#5C8B6E', border: '2px solid white', borderRadius: '50%', cursor: 'se-resize', zIndex: 10 }} />
                  )}
                </div>
              ))}
              {elements.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <p style={{ color: '#B66A4A', opacity: 0.4, fontSize: 14, textAlign: 'center' }}>
                    {isFirstPage ? 'Your book cover\nAdd text or images' : 'Empty page\nAdd text or images'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page nav */}
        <div className="bg-[#FFFFF0] border-t border-[#FFCBA4]/40 px-4 py-2 flex items-center justify-center gap-4">
          <button disabled={currentPageIdx === 0} onClick={() => switchPage(currentPageIdx - 1)} className="p-1.5 text-[#6B4C3B] disabled:opacity-30 hover:bg-[#FFE8D6]/60 rounded-lg transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-[#6B4C3B]">{currentPageIdx === 0 ? 'Cover' : `Page ${currentPageIdx} of ${pages.length - 1}`}</span>
          <button disabled={currentPageIdx === pages.length - 1} onClick={() => switchPage(currentPageIdx + 1)} className="p-1.5 text-[#6B4C3B] disabled:opacity-30 hover:bg-[#FFE8D6]/60 rounded-lg transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Order modal */}
      {showOrderModal && (
        <OrderModal book={book} pages={pages} onClose={() => setShowOrderModal(false)} navigate={navigate} />
      )}
    </div>
  )
}

// Order modal inline component
function OrderModal({ book, pages, onClose, navigate }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '' })
  const [quality, setQuality] = useState('standard')
  const [qty, setQty] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [err, setErr] = useState('')

  const PRICES = { standard: 499, premium: 899, luxury: 1499 }
  const total = PRICES[quality] * qty

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleOrder = async () => {
    const required = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pincode']
    if (required.some(k => !form[k].trim())) { setErr('Please fill all required fields'); return }
    setErr('')
    setPlacing(true)

    try {
      // Create Razorpay order via a simple amount
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
      
      // Create order in DB first
      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        parent_id: user.id,
        book_id: book.id,
        print_quality: quality,
        quantity: qty,
        price_inr: total,
        status: 'pending_payment',
        ...form,
      }).select().single()

      if (orderErr) throw new Error(orderErr.message)

      if (typeof pendo !== 'undefined') {
        pendo.track('order_created', {
          order_id: order.id,
          book_id: book.id,
          print_quality: quality,
          quantity: qty,
          total_price_inr: total,
          book_title: book.title,
          page_count: pages.length,
        })
      }

      // Open Razorpay
      if (!window.Razorpay) {
        throw new Error('Razorpay checkout failed to load. Please refresh the page and try again.')
      }

      const options = {
        key: razorpayKey,
        amount: total * 100,
        currency: 'INR',
        name: 'Memo Graph',
        description: `Memory Book: ${book.title}`,
        handler: async (response) => {
          // Perform server-side verification and DB updates via serverless endpoint
          try {
            const verify = await fetch('/api/verify-razorpay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                book,
                form,
                quality,
                total,
                pages,
                customer_email: user.email,
              })
            })
            const data = await verify.json().catch(() => ({}))
            if (!verify.ok) {
              console.error('Verification failed', data)
              try { await supabase.from('order_status_history').insert({ order_id: order.id, status: 'server_verify_failed', note: JSON.stringify(data) }) } catch(_){}
              if (typeof pendo !== 'undefined') {
                pendo.track('payment_failed', {
                  order_id: order.id,
                  book_id: book.id,
                  error_type: 'verification_failed',
                  total_price_inr: total,
                  print_quality: quality,
                })
              }
              setErr('Payment verification failed — contact support')
            } else {
              if (typeof pendo !== 'undefined') {
                pendo.track('payment_completed', {
                  order_id: order.id,
                  book_id: book.id,
                  print_quality: quality,
                  quantity: qty,
                  total_price_inr: total,
                  razorpay_payment_id: response.razorpay_payment_id,
                })
              }
              try { onClose() } catch(_){}
              navigate('/orders')
            }
          } catch (e) {
            console.error('Error calling verification endpoint', e)
            if (typeof pendo !== 'undefined') {
              pendo.track('payment_failed', {
                order_id: order.id,
                book_id: book.id,
                error_type: 'verification_error',
                total_price_inr: total,
                print_quality: quality,
              })
            }
            setErr('Payment verification error')
          }
        },
        prefill: { name: form.full_name, email: user.email, contact: form.phone },
        notes: {
          order_id: order.id,
          customer_email: user.email,
        },
        theme: { color: '#B66A4A' },
        modal: { ondismiss: () => setPlacing(false) }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      setErr(e.message)
      setPlacing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#FFCBA4]/40">
          <h2 className="font-display text-xl font-semibold text-[#2C1810]">Place your order</h2>
          <button onClick={onClose}><X size={20} className="text-[#6B4C3B]" /></button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{err}</div>}

          {/* Print quality */}
          <div>
            <p className="text-sm font-medium text-[#2C1810] mb-2">Print quality</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ k: 'standard', label: 'Standard', price: '₹499' }, { k: 'premium', label: 'Premium', price: '₹899' }, { k: 'luxury', label: 'Luxury', price: '₹1,499' }].map(o => (
                <button key={o.k} onClick={() => setQuality(o.k)} className={`p-3 rounded-xl border text-center transition-all ${quality === o.k ? 'border-[#B66A4A] bg-[#FFE8D6]' : 'border-[#FFCBA4]/60 hover:border-[#B66A4A]/40'}`}>
                  <p className="text-sm font-medium text-[#2C1810]">{o.label}</p>
                  <p className="text-xs text-[#B66A4A] font-semibold">{o.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-[#2C1810]">Quantity</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 border border-[#FFCBA4]/60 rounded-lg text-[#6B4C3B] hover:bg-[#FFE8D6]/40">−</button>
              <span className="w-6 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 border border-[#FFCBA4]/60 rounded-lg text-[#6B4C3B] hover:bg-[#FFE8D6]/40">+</button>
            </div>
            <div className="flex-1" />
            <p className="font-semibold text-[#B66A4A]">₹{total.toLocaleString('en-IN')}</p>
          </div>

          {/* Delivery address */}
          <div>
            <p className="text-sm font-medium text-[#2C1810] mb-3">Delivery address</p>
            <div className="space-y-3">
              {[
                { k: 'full_name', label: 'Full name', type: 'text' },
                { k: 'phone', label: 'Phone', type: 'tel' },
                { k: 'address_line1', label: 'Address line 1', type: 'text' },
                { k: 'address_line2', label: 'Address line 2 (optional)', type: 'text' },
              ].map(f => (
                <input key={f.k} type={f.type} placeholder={f.label} value={form[f.k]} onChange={e => update(f.k, e.target.value)}
                  className="w-full border border-[#FFCBA4]/60 rounded-xl px-4 py-2.5 text-sm bg-[#FFFFF0] focus:outline-none focus:ring-2 focus:ring-[#5C8B6E]/40" />
              ))}
              <div className="grid grid-cols-3 gap-2">
                {[{ k: 'city', label: 'City' }, { k: 'state', label: 'State' }, { k: 'pincode', label: 'Pincode' }].map(f => (
                  <input key={f.k} type="text" placeholder={f.label} value={form[f.k]} onChange={e => update(f.k, e.target.value)}
                    className="border border-[#FFCBA4]/60 rounded-xl px-3 py-2.5 text-sm bg-[#FFFFF0] focus:outline-none focus:ring-2 focus:ring-[#5C8B6E]/40" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-[#FFCBA4]/40">
          <button onClick={handleOrder} disabled={placing} className="w-full bg-[#B66A4A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#8C4F34] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {placing ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
            {placing ? 'Opening payment...' : `Pay ₹${total.toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Preview modal: shows thumbnails of each page with scaled rendering of elements
function PreviewModal({ pages, onClose }) {
  const SCALE = 0.28
  const getPageDims = (ratio) => {
    const w = CANVAS_W
    switch (ratio) {
      case '16:9': return { w, h: Math.round(w * 9 / 16) }
      case '1:1': return { w, h: w }
      case '4:3': return { w, h: Math.round(w * 3 / 4) }
      case '3:4': return { w, h: Math.round(w * 4 / 3) }
      case '9:16':
      default: return { w, h: Math.round(w * 16 / 9) }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-60 p-8 overflow-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-[#2C1810]">Preview — Pages</h3>
          <button onClick={onClose} className="text-[#6B4C3B]"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {pages.map(p => {
            const { w, h } = getPageDims(p.aspect_ratio || '9:16')
            return (
              <div key={p.id} className="bg-[#FFFFF0] p-3 rounded-lg border border-[#F1E7DF]">
                <div style={{ width: Math.round(w * SCALE), height: Math.round(h * SCALE), overflow: 'hidden', position: 'relative', background: '#fff', border: '1px solid #E8E8E8', borderRadius: 6 }}>
                  {(p.canvas_data?.elements || []).map(el => (
                    el.type === 'image' ? (
                      <img key={el.id} src={el.src} alt="" style={{ position: 'absolute', left: el.x * SCALE, top: el.y * SCALE, width: el.w * SCALE, height: el.h * SCALE, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <div key={el.id} style={{ position: 'absolute', left: el.x * SCALE, top: el.y * SCALE, width: el.w * SCALE, height: el.h * SCALE, fontSize: (el.fontSize || 14) * SCALE, color: el.color || '#2C1810', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{el.text}</div>
                    )
                  ))}
                </div>
                <p className="text-xs text-[#6B4C3B] mt-2">Page {p.position}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

async function sendAdminEmail(order, book, form, quality, total, pages) {
  // Generate a simple PDF data URI for the book summary
  // We'll use the Resend API directly from the client (CORS-safe since Resend allows it)
  const resendKey = import.meta.env.VITE_RESEND_API_KEY
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const resendSender = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  if (!resendKey) throw new Error('Missing Resend API key')
  if (!adminEmail) throw new Error('Missing admin email address')

  const htmlContent = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FFFFF0">
      <div style="background:#B66A4A;color:white;padding:20px;border-radius:12px;text-align:center;margin-bottom:24px">
        <h1 style="margin:0;font-size:24px">📖 New Order Received</h1>
        <p style="margin:8px 0 0;opacity:0.9">Memo Graph</p>
      </div>
      <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #FFCBA4">
        <h2 style="color:#2C1810;margin:0 0 16px;font-size:18px">Order Details</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Order ID</td><td style="padding:8px 0;color:#2C1810;font-weight:600;font-size:14px">${order.id}</td></tr>
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Book Title</td><td style="padding:8px 0;color:#2C1810;font-weight:600;font-size:14px">${book.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Print Quality</td><td style="padding:8px 0;color:#2C1810;font-weight:600;font-size:14px;text-transform:capitalize">${quality}</td></tr>
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Total Pages</td><td style="padding:8px 0;color:#2C1810;font-weight:600;font-size:14px">${pages.length}</td></tr>
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Amount</td><td style="padding:8px 0;color:#B66A4A;font-weight:700;font-size:18px">₹${total.toLocaleString('en-IN')}</td></tr>
        </table>
      </div>
      <div style="background:white;border-radius:12px;padding:20px;border:1px solid #FFCBA4">
        <h2 style="color:#2C1810;margin:0 0 16px;font-size:18px">Delivery Address</h2>
        <p style="color:#2C1810;font-weight:600;margin:0 0 4px;font-size:15px">${form.full_name}</p>
        <p style="color:#6B4C3B;margin:0 0 4px;font-size:14px">${form.phone}</p>
        <p style="color:#6B4C3B;margin:0 0 4px;font-size:14px">${form.address_line1}${form.address_line2 ? ', ' + form.address_line2 : ''}</p>
        <p style="color:#6B4C3B;margin:0;font-size:14px">${form.city}, ${form.state} — ${form.pincode}</p>
      </div>
      <p style="color:#6B4C3B;font-size:12px;text-align:center;margin-top:24px">Memo Graph · Made with love, printed with care</p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Memo Graph Orders <${resendSender}>`,
      to: [adminEmail],
      subject: `📖 New Order: ${book.title} — ₹${total.toLocaleString('en-IN')}`,
      html: htmlContent,
    })
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Email API failed: ${res.status} ${res.statusText} ${body}`)
  }
}

async function sendCustomerEmail(order, book, form, quality, total, pages, customerEmail) {
  const resendKey = import.meta.env.VITE_RESEND_API_KEY
  const resendSender = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  if (!resendKey) throw new Error('Missing Resend API key')
  if (!customerEmail) return

  const htmlContent = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FFFFF0">
      <div style="background:#B66A4A;color:white;padding:20px;border-radius:12px;text-align:center;margin-bottom:24px">
        <h1 style="margin:0;font-size:24px">Thank you for your order!</h1>
        <p style="margin:8px 0 0;opacity:0.9">Your Memo Graph book is confirmed.</p>
      </div>
      <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #FFCBA4">
        <h2 style="color:#2C1810;margin:0 0 16px;font-size:18px">Order Summary</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Order ID</td><td style="padding:8px 0;color:#2C1810;font-weight:600;font-size:14px">${order.id}</td></tr>
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Book Title</td><td style="padding:8px 0;color:#2C1810;font-weight:600;font-size:14px">${book.title}</td></tr>
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Print Quality</td><td style="padding:8px 0;color:#2C1810;font-weight:600;font-size:14px;text-transform:capitalize">${quality}</td></tr>
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Quantity</td><td style="padding:8px 0;color:#2C1810;font-weight:600;font-size:14px">${pages.length}</td></tr>
          <tr><td style="padding:8px 0;color:#6B4C3B;font-size:14px">Amount</td><td style="padding:8px 0;color:#B66A4A;font-weight:700;font-size:18px">₹${total.toLocaleString('en-IN')}</td></tr>
        </table>
      </div>
      <div style="background:white;border-radius:12px;padding:20px;border:1px solid #FFCBA4">
        <h2 style="color:#2C1810;margin:0 0 16px;font-size:18px">Delivery Address</h2>
        <p style="color:#2C1810;font-weight:600;margin:0 0 4px;font-size:15px">${form.full_name}</p>
        <p style="color:#6B4C3B;margin:0 0 4px;font-size:14px">${form.phone}</p>
        <p style="color:#6B4C3B;margin:0 0 4px;font-size:14px">${form.address_line1}${form.address_line2 ? ', ' + form.address_line2 : ''}</p>
        <p style="color:#6B4C3B;margin:0;font-size:14px">${form.city}, ${form.state} — ${form.pincode}</p>
      </div>
      <p style="color:#6B4C3B;font-size:12px;text-align:center;margin-top:24px">Memo Graph · Made with love, printed with care</p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Memo Graph <${resendSender}>`,
      to: [customerEmail],
      subject: `Your Memo Graph order is confirmed — ${book.title}`,
      html: htmlContent,
    })
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Customer email failed: ${res.status} ${res.statusText} ${body}`)
  }
}
