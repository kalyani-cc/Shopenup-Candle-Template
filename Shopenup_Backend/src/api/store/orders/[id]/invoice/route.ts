import { AuthenticatedShopenupRequest, ShopenupResponse } from "@shopenup/framework";

export async function GET(req: AuthenticatedShopenupRequest, res: ShopenupResponse) {
  try {
    const { id: orderId } = req.params;
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const query = req.scope.resolve("query") as any;
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: [
        "id",
        "display_id",
        "customer_id",
        "document_invoice.id",
        "document_invoice.displayNumber",
        "document_invoice.invoice_path",
      ],
    });

    const order = orders?.[0];
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.customer_id && order.customer_id !== customerId) {
      return res.status(403).json({ message: "You do not have access to this invoice" });
    }

    const invoice = order.document_invoice;
    const invoicePath = invoice?.invoice_path as string | undefined;

    if (!invoicePath) {
      return res.status(404).json({
        message: "Invoice not generated yet",
      });
    }

    const proto = (req.headers["x-forwarded-proto"] as string) || "http";
    const host = req.headers.host as string;
    const normalizedPath = invoicePath.startsWith("/") ? invoicePath : `/${invoicePath}`;
    const invoiceUrl = /^https?:\/\//i.test(invoicePath)
      ? invoicePath
      : `${proto}://${host}${normalizedPath}`;

    const fileResponse = await fetch(invoiceUrl);
    if (!fileResponse.ok) {
      return res.status(404).json({
        message: "Stored invoice file was not found",
      });
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    const fileName = `invoice-${invoice?.displayNumber || order.display_id || order.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(fileBuffer);
  } catch (e) {
    return res.status(500).json({
      message: e instanceof Error ? e.message : "Failed to download invoice",
    });
  }
}
