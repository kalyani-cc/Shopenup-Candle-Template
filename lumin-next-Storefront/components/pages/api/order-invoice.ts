import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_SHOPENUP_BACKEND_URL || 'http://localhost:9000'
    const adminToken = process.env.ADMIN_API_TOKEN
    if (!adminToken) {
      return res.status(200).json({ invoice: undefined, settings: undefined })
    }

    const orderId = (req.method === 'GET' ? req.query.orderId : req.body?.orderId) as string | undefined
    if (!orderId) {
      return res.status(400).json({ message: 'orderId required' })
    }

    const headers = {
      'Content-Type': 'application/json',
      authorization: `Bearer ${adminToken}`,
    }
    // Fetch document settings for store address
    let documentSettings: any = undefined
    let logoUrl: string | undefined
    try {
      const settingsRes = await fetch(`${backendUrl}/admin/documents/document-settings`, {
        headers,
        cache: 'no-store',
      })
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json() as any
        documentSettings = settingsData?.settings
        // Try common fields for logo URL
        logoUrl = documentSettings?.logoUrl
          || documentSettings?.logo_url
          || documentSettings?.logo?.url
          || documentSettings?.logo
          || undefined
      }
    } catch {}

    // Fetch store name and default stock location
    let storeName: string | undefined
    let stockLocation: any | undefined
    try {
      const storeRes = await fetch(`${backendUrl}/admin/store`, {
        headers,
        cache: 'no-store',
      })
      if (storeRes.ok) {
        const storeData = await storeRes.json() as any
        storeName = storeData?.store?.name || storeData?.name
        const defaultLocId = storeData?.store?.default_location_id || storeData?.default_location_id
        if (defaultLocId) {
          try {
            const locRes = await fetch(`${backendUrl}/admin/stock-locations/${defaultLocId}`, {
              headers,
              cache: 'no-store',
            })
            if (locRes.ok) {
              const locData = await locRes.json() as any
              stockLocation = locData?.stock_location || locData
            }
          } catch {}
        }
      }
    } catch {}

    // Try fetch existing invoice for order (same endpoint as admin panel uses)
    const getRes = await fetch(`${backendUrl}/admin/documents/invoice?orderId=${encodeURIComponent(orderId)}`, {
      headers,
      cache: 'no-store',
    })
    if (getRes.ok) {
      const data = await getRes.json() as any
      if (data?.invoice) {
        // Also fetch full order details from admin API
        let fullOrder: any = undefined
        try {
          const orderRes = await fetch(`${backendUrl}/admin/orders/${orderId}`, {
            headers,
            cache: 'no-store',
          })
          if (orderRes.ok) {
            const orderData = await orderRes.json() as any
            fullOrder = orderData.order
            
            // Extract stock location from fulfillment (if fulfilled) or order
            let finalStockLocation = stockLocation;
            let locationId = null;
            
            // First try to get location ID from fulfillments (when order is fulfilled)
            if (fullOrder.fulfillments && fullOrder.fulfillments.length > 0) {
              const fulfillment = fullOrder.fulfillments[0];
              locationId = fulfillment.location_id || fulfillment.stock_location_id;
              finalStockLocation = fulfillment.location || fulfillment.stock_location || finalStockLocation;
            }
            
            // Fallback to order-level stock location
            if (!finalStockLocation) {
              finalStockLocation = fullOrder.stock_location || fullOrder.stockLocation;
            }
            
            // If we have a location ID but no address, fetch the location details
            if (locationId && !finalStockLocation?.address) {
              try {
                const locRes = await fetch(`${backendUrl}/admin/stock-locations/${locationId}`, {
                  headers,
                  cache: 'no-store',
                })
                if (locRes.ok) {
                  const locData = await locRes.json() as any
                  finalStockLocation = locData.stock_location || locData
                }
              } catch {}
            }
            
            // Update stockLocation with the final location
            if (finalStockLocation) {
              stockLocation = finalStockLocation;
            }
          }
        } catch {}
        
        // Extract PDF URL from invoice document (check multiple possible fields)
        // The invoice document should have the PDF URL that matches admin panel
        const pdfUrl = data.invoice?.file_url 
          || data.invoice?.pdf_url 
          || data.invoice?.file?.url 
          || data.invoice?.url
          || data.invoice?.file_urls?.pdf
          || data.invoice?.document_url
          || data.invoice?.download_url
          || data.invoice?.file_path;
        
        // Also try fetching from documents list API to get the document with PDF URL
        let documentPdfUrl = pdfUrl;
        if (!documentPdfUrl) {
          try {
            const docsRes = await fetch(`${backendUrl}/admin/documents?order_id=${encodeURIComponent(orderId)}`, {
              headers,
              cache: 'no-store',
            })
            if (docsRes.ok) {
              const docsData = await docsRes.json() as any
              const document = Array.isArray(docsData?.documents) 
                ? docsData.documents.find((doc: any) => doc.type === 'invoice' || doc.category === 'invoice')
                : docsData?.document;
              
              if (document) {
                documentPdfUrl = document.file_url 
                  || document.pdf_url 
                  || document.file?.url 
                  || document.url
                  || document.file_urls?.pdf
                  || document.document_url
                  || document.download_url
                  || document.file_path;
              }
            }
          } catch {}
        }
        
        return res.status(200).json({ 
          invoice: data.invoice,
          settings: documentSettings,
          storeName: storeName,
          logoUrl: logoUrl,
          stockLocation,
          order: fullOrder,
          pdfUrl: documentPdfUrl || pdfUrl
        })
      }
    }

    // Generate if missing
    const postRes = await fetch(`${backendUrl}/admin/documents/invoice`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ order_id: orderId }),
    })
    if (!postRes.ok) {
      return res.status(200).json({ 
        invoice: undefined,
        settings: documentSettings,
        storeName: storeName,
        logoUrl: logoUrl,
        stockLocation,
        order: undefined
      })
    }
    const gen = await postRes.json() as any
    
    // Also fetch full order details from admin API
    let fullOrder: any = undefined
    try {
      const orderRes = await fetch(`${backendUrl}/admin/orders/${orderId}`, {
        headers,
        cache: 'no-store',
      })
      if (orderRes.ok) {
        const orderData = await orderRes.json() as any
        fullOrder = orderData.order
        
        // Extract stock location from fulfillment (if fulfilled) or order
        let finalStockLocation = stockLocation;
        let locationId = null;
        
        // First try to get location ID from fulfillments (when order is fulfilled)
        if (fullOrder.fulfillments && fullOrder.fulfillments.length > 0) {
          const fulfillment = fullOrder.fulfillments[0];
          locationId = fulfillment.location_id || fulfillment.stock_location_id;
          finalStockLocation = fulfillment.location || fulfillment.stock_location || finalStockLocation;
        }
        
        // Fallback to order-level stock location
        if (!finalStockLocation) {
          finalStockLocation = fullOrder.stock_location || fullOrder.stockLocation;
        }
        
        // If we have a location ID but no address, fetch the location details
        if (locationId && !finalStockLocation?.address) {
          try {
            const locRes = await fetch(`${backendUrl}/admin/stock-locations/${locationId}`, {
              headers,
              cache: 'no-store',
            })
            if (locRes.ok) {
              const locData = await locRes.json() as any
              finalStockLocation = locData.stock_location || locData
            }
          } catch {}
        }
        
        // Update stockLocation with the final location
        if (finalStockLocation) {
          stockLocation = finalStockLocation;
        }
      }
    } catch {}
    
    // Extract PDF URL from generated invoice document (check multiple possible fields)
    const pdfUrl = gen?.invoice?.file_url 
      || gen?.invoice?.pdf_url 
      || gen?.invoice?.file?.url 
      || gen?.invoice?.url
      || gen?.invoice?.file_urls?.pdf
      || gen?.invoice?.document_url
      || gen?.invoice?.download_url
      || gen?.invoice?.file_path;
    
    return res.status(200).json({ 
      invoice: gen?.invoice,
      settings: documentSettings,
      storeName: storeName,
      logoUrl: logoUrl,
      stockLocation,
      order: fullOrder,
      pdfUrl: pdfUrl
    })
  } catch (error) {
    console.error('❌ [order-invoice] Error:', error);
    return res.status(500).json({ 
      invoice: undefined, 
      settings: undefined,
      error: error instanceof Error ? error.message : 'Failed to fetch order invoice'
    })
  }
}


