import type { NextApiRequest, NextApiResponse } from 'next'
import { parseShopenupJwtFromCookieHeader } from '@/lib/shopenup/cookies'

function headerString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined
  return Array.isArray(v) ? v[0] : v
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const backendUrl = process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY

  const orderId = req.query.orderId as string | undefined
  if (!orderId) {
    return res.status(400).json({ message: 'orderId required' })
  }

  if (!publishableKey) {
    return res.status(500).json({ message: 'Missing NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY' })
  }

  try {
    // Build headers for backend API call
    const headers: Record<string, string> = {
      'x-publishable-api-key': publishableKey,
    }
    
    const cookieHeader = headerString(req.headers.cookie)
    let authHeader = headerString(req.headers.authorization)
    if (!authHeader && cookieHeader) {
      const jwt = parseShopenupJwtFromCookieHeader(cookieHeader)
      if (jwt) authHeader = `Bearer ${jwt}`
    }
    if (authHeader) headers.authorization = authHeader
    if (cookieHeader) headers.cookie = cookieHeader

    // Call the backend route: HEAD /store/orders/[id]/invoices
    // Use HEAD to check if invoice exists without downloading
    const url = `${backendUrl}/store/orders/${encodeURIComponent(orderId)}/invoices`
    
    let getRes: Response
    try {
      // Try HEAD request first (more efficient)
      getRes = await fetch(url, {
        method: 'HEAD',
        headers,
        credentials: 'include',
        cache: 'no-store',
      })
    } catch {
      // If HEAD fails, try GET but only check status
      getRes = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store',
      })
    }
    
    // Return whether invoice exists (status 200-299 means exists)
    return res.status(200).json({ exists: getRes.ok })
  } catch (error: any) {
    console.error('[check-invoice-exists] Error:', error)
    return res.status(500).json({ message: error.message || 'Failed to check invoice existence', exists: false })
  }
}

