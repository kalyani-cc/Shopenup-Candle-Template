import type { NextApiRequest, NextApiResponse } from 'next'
import { parseShopenupJwtFromCookieHeader } from '@/lib/shopenup/cookies'

function headerString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined
  return Array.isArray(v) ? v[0] : v
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL
    const publishableKey = process.env.NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY

    const incomingOrderId = (req.method === 'GET' ? req.query.orderId : req.body?.orderId) as string | undefined
    if (!incomingOrderId) {
      return res.status(400).json({ message: 'orderId required' })
    }

    if (!publishableKey) {
      return res.status(500).json({ message: 'Missing NEXT_PUBLIC_SHOPENUP_PUBLISHABLE_KEY' })
    }

    const extractPdfUrl = (doc: any | undefined): string | undefined => {
      if (!doc) return undefined
      return (
        doc.file_url ||
        doc.pdf_url ||
        doc.file?.url ||
        doc.url ||
        doc.file_urls?.pdf ||
        doc.document_url ||
        doc.download_url ||
        doc.file_path
      )
    }

    const streamPdfFromUrl = async (pdfUrl: string) => {
      const absolutePdfUrl = pdfUrl.startsWith('http') ? pdfUrl : `${backendUrl}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`
      const pdfResponse = await fetch(absolutePdfUrl, { cache: 'no-store' })
      if (!pdfResponse.ok) {
        return res.status(pdfResponse.status).json({ message: `Failed to fetch PDF: ${pdfResponse.statusText}` })
      }
      const pdfBuffer = await pdfResponse.arrayBuffer()
      const contentType = pdfResponse.headers.get('content-type') || 'application/pdf'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `inline; filename="invoice.pdf"`)
      res.setHeader('Cache-Control', 'private, max-age=3600')
      return res.status(200).send(Buffer.from(pdfBuffer))
    }
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

    // Call the backend route: GET /store/orders/[id]/invoices
    // This route returns the PDF buffer directly (not JSON)
    const url = `${backendUrl}/store/orders/${encodeURIComponent(incomingOrderId)}/invoices`
    
    const getRes = await fetch(url, {
      cache: 'no-store',
      headers,
      credentials: 'include', // Include cookies in the request
    })
    
    if (!getRes.ok) {
      const errorText = await getRes.text()
      let errorMessage = `Invoice fetch failed: ${getRes.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch {
        // Use default error message if not JSON
      }
      console.error('[open-invoice-pdf] Error response:', errorMessage)
      return res.status(getRes.status).json({ message: errorMessage })
    }

    // Check if response is PDF (backend returns PDF buffer directly)
    const contentType = getRes.headers.get('content-type') || ''
    if (contentType.includes('application/pdf')) {
      // Get the PDF buffer from the response
      const pdfBuffer = await getRes.arrayBuffer()
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = getRes.headers.get('content-disposition') || ''
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
      const filename = filenameMatch ? filenameMatch[1] : `invoice-${incomingOrderId}.pdf`
      
      
      // Set headers and stream the PDF
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
      res.setHeader('Cache-Control', 'private, max-age=3600')
      return res.status(200).send(Buffer.from(pdfBuffer))
    }

    // If not PDF, try to parse as JSON (fallback - shouldn't happen)
    const data = await getRes.json().catch(() => null)
    if (data) {
      return res.status(500).json({ message: 'Unexpected response format from backend' })
    }

    return res.status(500).json({ message: 'Failed to retrieve invoice PDF' })
  } catch (error: any) {
    console.error('❌ [open-invoice-pdf] Error:', error);
    return res.status(500).json({ 
      message: error?.message || 'Failed to open invoice PDF',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
