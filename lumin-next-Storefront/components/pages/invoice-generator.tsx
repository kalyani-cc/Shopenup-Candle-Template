 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 import { getAuthHeadersClient } from "@/lib/shopenup/client-cookies";
 
 type InvoiceGeneratorProps = {
   orderId: string;
   className?: string;
 };
 
 export default function InvoiceGenerator({ orderId, className }: InvoiceGeneratorProps) {
   const [exists, setExists] = useState<boolean | null>(null);
   const [loading, setLoading] = useState(false);
 
   const href = useMemo(() => `/api/open-invoice-pdf?orderId=${encodeURIComponent(orderId)}`, [orderId]);
 
   useEffect(() => {
     let cancelled = false;
     const run = async () => {
       try {
        const res = await fetch(`/api/check-invoice-exists?orderId=${encodeURIComponent(orderId)}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeadersClient(),
          },
        });
         const data = (await res.json().catch(() => null)) as { exists?: boolean } | null;
         if (!cancelled) setExists(Boolean(data?.exists));
       } catch {
         if (!cancelled) setExists(null);
       }
     };
     void run();
     return () => {
       cancelled = true;
     };
   }, [orderId]);
 
   const label = exists === false ? "Invoice not available" : "Open invoice (PDF)";
 
   return (
     <button
       type="button"
       className={className ?? "btn btn-outline-primary btn-sm"}
       disabled={exists === false || loading}
       onClick={() => {
         setLoading(true);
         // Open in a new tab so the PDF can stream inline.
         window.open(href, "_blank", "noopener,noreferrer");
         // We can't reliably know when the tab finishes loading; just re-enable quickly.
         window.setTimeout(() => setLoading(false), 500);
       }}
     >
       {loading ? "Opening…" : label}
     </button>
   );
 }
