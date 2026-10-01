import dayjs from "dayjs";

export interface ThermalReceiptData {
  clinic?: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    logo?: string | null;
    tax_number?: string | null;
    footer_note?: string | null;
  };
  invoiceNumber: string;
  date?: string | Date;
  customer: {
    name: string;
    phone?: string | null;
    medical_id?: string | null;
    current_balance?: number;
    advance_balance?: number;
  };
  doctor?: {
    name?: string | null;
  } | null;
  visitNo?: number | string;
  tokenNumber: string;
  items: Array<{
    name?: string;
    product_name?: string;
    item_group_name?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    sessions_allowed?: number;
    sessions_consumed?: number;
    sub_items?: string[];
  }>;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue?: number;
  remainingDue?: number;
  paymentMethod?: string;
}

export function generateThermalReceiptHtml(data: ThermalReceiptData): string {
  const clinicName = data.clinic?.name || "BEYOND BEAUTY CLINIC";
  const clinicAddress = data.clinic?.address || "Clinic Address Not Configured";
  const clinicPhone = data.clinic?.phone || "";
  const clinicLogo = data.clinic?.logo || "";
  const footerNote = data.clinic?.footer_note || "Divine Glow You Need";

  const formattedDate = dayjs(data.date || new Date()).format("DD-MMM-YYYY hh:mm A");
  const doctorName = data.doctor?.name ? `Dr ${data.doctor.name}` : "General / Self";

  // Group items by deal/package if item_group_name exists, or list individually
  const groupedItems: {
    [key: string]: {
      isGroup: boolean;
      name: string;
      total_price: number;
      sub_items: Array<{
        name: string;
        sessions: number;
        sessions_allowed?: number;
        sessions_consumed?: number;
        unit_price?: number;
        total_price?: number;
      }>;
      single_items: Array<any>;
    };
  } = {};

  const standaloneItems: any[] = [];

  data.items.forEach((item) => {
    const itemName = item.name || item.product_name || "Service";
    if (item.item_group_name) {
      const groupKey = item.item_group_name;
      if (!groupedItems[groupKey]) {
        groupedItems[groupKey] = {
          isGroup: true,
          name: `${groupKey} (Deal)`,
          total_price: 0,
          sub_items: [],
          single_items: [],
        };
      }
      groupedItems[groupKey].total_price += Number(item.total_price) || 0;
      groupedItems[groupKey].sub_items.push({
        name: itemName.replace(new RegExp(`^${groupKey}\\s*-\\s*`, "i"), ""),
        sessions: item.sessions_allowed || item.quantity || 1,
        sessions_allowed: item.sessions_allowed || item.quantity || 1,
        sessions_consumed: item.sessions_consumed || 1,
        unit_price: Number(item.unit_price) || 0,
        total_price: Number(item.total_price) || 0,
      });
    } else {
      standaloneItems.push(item);
    }
  });

  // Calculate totals
  const grossTotal = Number(data.subtotal || 0);
  const discountAmount = Number(data.discount || 0);
  const grandTotal = Number(data.grandTotal || 0);
  const paidAmount = Number(data.paidAmount || 0);
  const balanceDue = Number(
    data.balanceDue !== undefined
      ? data.balanceDue
      : Math.max(0, grandTotal - paidAmount)
  );
  const previousOrRemaining = Number(
    data.remainingDue !== undefined
      ? data.remainingDue
      : data.customer?.current_balance !== undefined
        ? data.customer.current_balance
        : balanceDue
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${data.invoiceNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      html, body {
        width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body {
        padding: 3mm 2mm !important;
      }
      .no-print {
        display: none !important;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      width: 75mm;
      max-width: 75mm;
      margin: 0 auto;
      padding: 10px 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }

    .btn-print {
      display: block;
      width: 100%;
      padding: 8px;
      background: #4f46e5;
      color: white;
      text-align: center;
      font-weight: bold;
      border-radius: 6px;
      margin-bottom: 12px;
      cursor: pointer;
      border: none;
      font-size: 12px;
    }
    .btn-print:hover {
      background: #4338ca;
    }

    .logo-container {
      text-align: center;
      margin-bottom: 4px;
    }
    .logo-img {
      max-height: 52px;
      max-width: 130px;
      margin: 0 auto;
      display: block;
      object-fit: contain;
    }

    .clinic-title {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 2px 0;
      text-align: center;
    }
    .clinic-info {
      font-size: 9.5px;
      color: #222;
      text-align: center;
      margin-bottom: 1px;
      line-height: 1.2;
    }

    .meta-section {
      margin-top: 6px;
      font-size: 10px;
      line-height: 1.35;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
    }

    .token-container {
      text-align: center;
      margin: 6px 0 4px 0;
    }
    .token-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .token-value {
      font-size: 26px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: 1px;
    }

    .divider-solid {
      border-top: 1.5px solid #000;
      margin: 5px 0;
    }
    .divider-dashed {
      border-top: 1px dashed #666;
      margin: 4px 0;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 2px 0;
    }
    .items-table th {
      font-size: 10.5px;
      font-weight: 800;
      padding-bottom: 3px;
    }
    .items-table td {
      font-size: 10px;
      vertical-align: top;
      padding: 2px 0;
    }
    .item-sub-bullet {
      font-size: 9px;
      color: #222;
      padding-left: 6px;
      line-height: 1.2;
    }

    .totals-box {
      margin-top: 4px;
      font-size: 10.5px;
      line-height: 1.35;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1px;
    }

    .payable-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13.5px;
      font-weight: 900;
      margin: 5px 0;
      padding: 2px 0;
    }

    .footer-tagline {
      font-style: italic;
      font-weight: 700;
      font-size: 10.5px;
      margin: 10px 0 6px 0;
      text-align: center;
    }
    .branding-box {
      font-size: 8.5px;
      line-height: 1.3;
      color: #333;
      text-align: center;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Click to Print Receipt</button>
  </div>

  <!-- CLINIC HEADER -->
  ${clinicLogo
      ? `<div class="logo-container"><img src="${clinicLogo}" class="logo-img" alt="Clinic Logo" /></div>`
      : ""
    }
  <div class="clinic-title">${clinicName}</div>
  ${clinicAddress ? `<div class="clinic-info">${clinicAddress}</div>` : ""}
  ${clinicPhone ? `<div class="clinic-info">${clinicPhone}</div>` : ""}
  ${data.clinic?.tax_number
      ? `<div class="clinic-info">NTN: ${data.clinic.tax_number}</div>`
      : ""
    }

  <!-- INVOICE & PATIENT META -->
  <div class="meta-section">
    <div class="meta-row">
      <span class="font-bold">INV: ${data.invoiceNumber}</span>
      <span class="font-bold">${formattedDate}</span>
    </div>
    <div><span class="font-bold">Patient:</span> ${data.customer.name || "Walk-in"}${data.customer.phone ? ` | ${data.customer.phone}` : ""
    }</div>
    <div><span class="font-bold">MR:</span> ${data.customer.medical_id || "N/A"}</div>
    <div><span class="font-bold">Visit No:</span> ${data.visitNo || 1}</div>
    <div><span class="font-bold">Ref By:</span> ${doctorName}</div>
  </div>

  <!-- QUEUE TOKEN NUMBER -->
  <div class="token-container">
    <div class="token-title">TOKEN NUMBER</div>
    <div class="token-value">${data.tokenNumber || "P-01"}</div>
  </div>

  <!-- DIVIDER -->
  <div class="divider-solid"></div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="text-left">Item</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      <!-- GROUPED DEALS / PACKAGES -->
      ${Object.values(groupedItems)
      .map(
        (group) => `
        <tr>
          <td class="text-left font-bold" style="padding-top: 4px;">${group.name}</td>
          <td class="text-right font-bold" style="padding-top: 4px;">${group.total_price > 0 ? group.total_price.toFixed(2) : "0.00"}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-bottom: 4px;">
            ${group.sub_items
              .map((s) => {
                const allowed = Number(s.sessions_allowed) || Number(s.sessions) || 1;
                const consumed = Number(s.sessions_consumed) || 1;
                const remaining = Math.max(0, allowed - consumed);
                return `
                  <div class="item-sub-bullet" style="margin-top: 1px;">
                    <strong>• ${s.name}</strong>: 
                    ${allowed > 1 
                      ? `Session ${consumed} of ${allowed} (${remaining} Remaining)` 
                      : `1 Session`
                    }
                  </div>
                  ${allowed > 1 ? `
                    <div class="item-sub-bullet" style="font-size: 8.5px; color: #555; padding-left: 14px;">
                      Bundled: ${allowed} | Consumed: ${consumed} | Left: ${remaining}
                    </div>
                  ` : ""}
                `;
              })
              .join("")}
          </td>
        </tr>
      `
      )
      .join("")}

      <!-- STANDALONE ITEMS -->
      ${standaloneItems
      .map(
        (item) => {
          const allowed = Number(item.sessions_allowed) || 1;
          const consumed = Number(item.sessions_consumed) || 1;
          const remaining = Math.max(0, allowed - consumed);
          const isPrepaid = Number(item.total_price || 0) === 0 && allowed > 1;

          return `
          <tr>
            <td class="text-left font-bold" style="padding-top: 3px;">
              ${item.name || item.product_name || "Service"}
            </td>
            <td class="text-right font-bold" style="padding-top: 3px;">
              ${Number(item.total_price || item.unit_price * item.quantity || 0).toFixed(2)}
            </td>
          </tr>
          ${allowed > 1 ? `
            <tr>
              <td colspan="2" class="item-sub-bullet" style="font-weight: 600; color: #111;">
                Session ${consumed} of ${allowed} (${remaining} Remaining)
              </td>
            </tr>
            <tr>
              <td colspan="2" class="item-sub-bullet" style="font-size: 8.5px; color: #555;">
                Bundled: ${allowed} | Consumed: ${consumed} | Left: ${remaining}${isPrepaid ? " • [Pre-paid Package]" : ""}
              </td>
            </tr>
          ` : (item.quantity > 1 ? `
            <tr>
              <td colspan="2" class="item-sub-bullet">
                Qty: ${item.quantity} × ${Number(item.unit_price).toFixed(2)}
              </td>
            </tr>
          ` : "")}
        `;
        }
      )
      .join("")}
    </tbody>
  </table>

  <!-- TOTALS SECTION -->
  <div class="totals-box">
    <div class="totals-row">
      <span>Gross Total:</span>
      <span>${grossTotal.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Discount:</span>
      <span>(${discountAmount.toFixed(2)})</span>
    </div>
    ${previousOrRemaining > 0
      ? `<div class="totals-row">
            <span>Remaining:</span>
            <span>PKR ${previousOrRemaining.toFixed(2)}</span>
          </div>`
      : ""
    }

    <!-- PAYABLE BANNER -->
    <div class="payable-banner">
      <span>PAYABLE: ${grandTotal.toFixed(2)}/-</span>
      <span></span>
    </div>

    <div class="totals-row">
      <span>Paid:</span>
      <span>${paidAmount.toFixed(2)}</span>
    </div>
    <div class="totals-row font-bold">
      <span>Balance Due:</span>
      <span>${balanceDue.toFixed(2)}</span>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-tagline">&ldquo;${footerNote}&rdquo;</div>

  <div class="branding-box">
    <div>Software Solution Provided By:</div>
    <div class="font-bold">FALCON SWIFT PVT. LTD.</div>
    <div>Website: www.falconswift.online</div>
    <div>Support: +92 326-3392082</div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;
}

export function printThermalReceipt(data: ThermalReceiptData) {
  const receiptHtml = generateThermalReceiptHtml(data);
  const printWindow = window.open(
    "",
    "_blank",
    "width=420,height=700,menubar=no,toolbar=no,location=no,status=no"
  );
  if (!printWindow) {
    alert("Popup blocked! Please allow popups for this site to print thermal receipts.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}
