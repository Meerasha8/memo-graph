import crypto from 'crypto'
import fetch from 'node-fetch'

// Vercel serverless function to verify Razorpay payment signatures,
// update Supabase (using service role key), and send emails via Resend.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      book,
      form,
      quality,
      total,
      pages,
      customer_email
    } = req.body

    const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const RESEND_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY
    const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL
    const RESEND_FROM = process.env.VITE_RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    if (!RAZORPAY_SECRET) return res.status(500).json({ error: 'Missing Razorpay secret on server' })
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Missing Supabase service role key' })

    // Verify signature
    const generated = crypto.createHmac('sha256', RAZORPAY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
    if (generated !== razorpay_signature) {
      // log attempted mismatch
      return res.status(400).json({ error: 'Invalid signature' })
    }

    // Update order via Supabase REST API
    const ordersUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/orders?id=eq.${orderId}`
    const commonHeaders = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }

    // Patch orders
    const updResp = await fetch(ordersUrl, {
      method: 'PATCH',
      headers: commonHeaders,
      body: JSON.stringify({ status: 'paid', razorpay_payment_id })
    })
    if (!updResp.ok) {
      const txt = await updResp.text().catch(() => '')
      // record failure in order_status_history
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/order_status_history`, { method: 'POST', headers: commonHeaders, body: JSON.stringify({ order_id: orderId, status: 'payment_update_failed', note: txt }) })
      } catch (_) {}
      return res.status(500).json({ error: 'Failed to update order', details: txt })
    }

    // Insert status history
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/order_status_history`, { method: 'POST', headers: commonHeaders, body: JSON.stringify({ order_id: orderId, status: 'paid', note: 'Payment completed' }) })
    } catch (_) {}

    // Update book status to ordered
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/books?id=eq.${book.id}`, { method: 'PATCH', headers: commonHeaders, body: JSON.stringify({ status: 'ordered' }) })
    } catch (_) {}

    // Send admin email (server-side) if keys present
    if (RESEND_KEY && ADMIN_EMAIL) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: `Memo Graph Orders <${RESEND_FROM}>`, to: [ADMIN_EMAIL], subject: `📖 New Order: ${book.title} — ₹${total.toLocaleString?.('en-IN') || total}`, html: `<p>Order ${orderId} paid.</p>` })
        })
      } catch (e) {
        try { await fetch(`${SUPABASE_URL}/rest/v1/order_status_history`, { method: 'POST', headers: commonHeaders, body: JSON.stringify({ order_id: orderId, status: 'email_failed', note: 'Admin email error' }) }) } catch(_){}
      }
    }

    // Send customer email (optional)
    if (RESEND_KEY && customer_email) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: `Memo Graph <${RESEND_FROM}>`, to: [customer_email], subject: `Your Memo Graph order is confirmed — ${book.title}`, html: `<p>Thanks — your order ${orderId} is confirmed.</p>` })
        })
      } catch (e) {
        try { await fetch(`${SUPABASE_URL}/rest/v1/order_status_history`, { method: 'POST', headers: commonHeaders, body: JSON.stringify({ order_id: orderId, status: 'customer_email_failed', note: 'Customer email error' }) }) } catch(_){}
      }
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
