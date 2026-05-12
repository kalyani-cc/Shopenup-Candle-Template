import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL || 'http://localhost:9000'

    // Optional: forward customer auth to backend if present (allows protected store endpoints)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const authHeader = req.headers['authorization'] || (req.headers.cookie as string | undefined)
    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer')) {
      headers['authorization'] = authHeader
    }

    // Try to fetch Store name and document store address from Admin API (secure: requires server env token)
    let storeName: string | undefined
    let documentStoreAddress: any | undefined
    try {
      const adminToken = process.env.ADMIN_API_TOKEN
      if (adminToken) {
        const adminRes = await fetch(`${backendUrl}/admin/store`, {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${adminToken}`,
          },
          cache: 'no-store',
        })
        if (adminRes.ok) {
          const data = await adminRes.json() as any
          storeName = data?.store?.name || data?.name
        }
        // Fetch document settings for storeAddress
        const docRes = await fetch(`${backendUrl}/admin/documents/document-settings`, {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${adminToken}`,
          },
          cache: 'no-store',
        })
        if (docRes.ok) {
          const doc = await docRes.json() as any
          documentStoreAddress = doc?.settings?.storeAddress
        }
      }
    } catch {}

    // Seller/company info could be sourced from env (fallbacks provided)
    const company = {
      name: storeName || process.env.NEXT_PUBLIC_COMPANY_NAME || 'Akshar Ayurved Pvt. Ltd.',
      address_line1: documentStoreAddress?.address_1 || process.env.NEXT_PUBLIC_COMPANY_ADDRESS_1 || 'Ahmedabad, Gujarat - 382220',
      address_line2: documentStoreAddress?.address_2 || process.env.NEXT_PUBLIC_COMPANY_ADDRESS_2 || '',
      city: documentStoreAddress?.city,
      province: documentStoreAddress?.province,
      postal_code: documentStoreAddress?.postal_code,
      phone: documentStoreAddress?.phone || process.env.NEXT_PUBLIC_COMPANY_PHONE || '+91 98765 43210',
      gstin: process.env.NEXT_PUBLIC_COMPANY_GSTIN || '',
      logo: process.env.NEXT_PUBLIC_COMPANY_LOGO || '/assets/logo.webp',
      tagline: process.env.NEXT_PUBLIC_COMPANY_TAGLINE || 'Traditional Medicine & Healthcare',
    }

    res.status(200).json({ company })
  } catch (e) {
    res.status(200).json({
      company: {
        name: 'Akshar Ayurved Pvt. Ltd.',
        address_line1: 'Ahmedabad, Gujarat - 382220',
        address_line2: '',
        gstin: '24AAAAA1111A1Z5',
        phone: '+91 98765 43210',
        logo: '/assets/logo.webp',
        tagline: 'Traditional Medicine & Healthcare',
      }
    })
  }
}


