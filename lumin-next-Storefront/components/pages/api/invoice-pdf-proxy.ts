import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL || 'http://localhost:9000'
  const adminToken = process.env.ADMIN_API_TOKEN
  
  if (!adminToken) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const pdfUrl = req.query.pdfUrl as string | undefined
  if (!pdfUrl) {
    return res.status(400).json({ message: 'pdfUrl required' })
  }

  try {
    // If PDF URL is relative, make it absolute
    const absolutePdfUrl = pdfUrl.startsWith('http') 
      ? pdfUrl 
      : `${backendUrl}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`

    // Fetch PDF with admin authentication
    const pdfResponse = await fetch(absolutePdfUrl, {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      cache: 'no-store',
    })

    if (!pdfResponse.ok) {
      return res.status(pdfResponse.status).json({ 
        message: `Failed to fetch PDF: ${pdfResponse.statusText}` 
      })
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()
    const contentType = pdfResponse.headers.get('content-type') || 'application/pdf'

    // Set headers for PDF download/view
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `inline; filename="invoice.pdf"`)
    res.setHeader('Cache-Control', 'private, max-age=3600')

    // Return PDF buffer
    return res.status(200).send(Buffer.from(pdfBuffer))
  } catch (error) {
    console.error('Error fetching PDF:', error)
    return res.status(500).json({ message: 'Failed to fetch PDF' })
  }
}

