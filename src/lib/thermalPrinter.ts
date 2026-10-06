import dayjs from "dayjs";

export interface ThermalReceiptItem {
  name?: string;
  product_name?: string;
  item_group_name?: string | null;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  price?: number;
  sessions_allowed?: number;
  sessions_consumed?: number;
  is_deal?: boolean;
  note?: string;
  children?: Array<{
    name: string;
    bundled: number;
    consumed: number;
    left: number;
    session?: number;
    session_no?: number;
  }>;
  sub_items?: any[];
}

export interface ThermalReceiptData {
  clinic?: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    logo?: string | null;
    tax_number?: string | null;
    footer_note?: string | null;
    thanks?: string | null;
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
  items: ThermalReceiptItem[];
  subtotal?: number;
  discount?: number;
  discountAmount?: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue?: number;
  remainingDue?: number;
  paymentMethod?: string;
}

function money(val: number | string | undefined | null): string {
  const n = Number(String(val ?? 0).replace(/,/g, "")) || 0;
  return n.toFixed(2);
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface ProcessedDealChild {
  name: string;
  bundled: number;
  consumed: number;
  left: number;
  session: number;
}

interface ProcessedDeal {
  type: "deal";
  name: string;
  price: number;
  children: ProcessedDealChild[];
}

interface ProcessedStandalone {
  type: "standalone";
  name: string;
  qty: number;
  unit_price: number;
  total_price: number;
  note?: string;
  sessions_allowed?: number;
  sessions_consumed?: number;
}

export function generateThermalReceiptHtml(data: ThermalReceiptData): string {
  const clinicName = escapeHtml(data.clinic?.name || "Skin-Lab Clinic");
  const clinicAddress = escapeHtml(data.clinic?.address || "");
  const clinicPhone = escapeHtml(data.clinic?.phone || "");
  const clinicLogo = data.clinic?.logo || "";
  const clinicLine = [clinicAddress, clinicPhone].filter(Boolean).join("  |  ");
  const clinicThanks = escapeHtml(
    data.clinic?.footer_note || data.clinic?.thanks || "Thank you for choosing our clinic!"
  );

  const formattedDate = dayjs(data.date || new Date()).format("DD-MMM-YYYY hh:mm A");

  const patientName = escapeHtml(data.customer.name || "Walk-in Patient");
  const patientPhone = escapeHtml(data.customer.phone || "");
  const mrNo = escapeHtml(data.customer.medical_id || "");
  const visitNo = escapeHtml(String(data.visitNo || 1));
  const tokenNumber = escapeHtml(String(data.tokenNumber || "P-01"));

  let refBy = "";
  if (data.doctor?.name) {
    const rawDoc = data.doctor.name.trim();
    refBy = escapeHtml(/^dr/i.test(rawDoc) ? rawDoc : `Dr. ${rawDoc}`);
  }

  // Process items into deals vs standalone services
  const processedItems: (ProcessedDeal | ProcessedStandalone)[] = [];
  const dealMap = new Map<string, ProcessedDeal>();

  (data.items || []).forEach((item) => {
    const rawChildren = item.children || item.sub_items;
    const isExplicitDeal = item.is_deal || (Array.isArray(rawChildren) && rawChildren.length > 0);

    if (isExplicitDeal && Array.isArray(rawChildren) && rawChildren.length > 0) {
      const dealName = item.name || item.product_name || "Package Deal";
      const dealPrice = Number(
        item.total_price !== undefined ? item.total_price : item.price || item.unit_price || 0
      );
      const kids: ProcessedDealChild[] = rawChildren.map((k: any) => {
        const name = k.name || k.title || k.product_name || "Service";
        const bundled = Number(k.bundled ?? k.total_sessions ?? k.sessions_allowed ?? 1);
        const consumed = Number(k.consumed ?? k.sessions_consumed ?? k.used ?? 1);
        const left = k.left !== undefined ? Number(k.left) : Math.max(0, bundled - consumed);
        const session = Number(k.session ?? k.session_no ?? consumed);
        return { name, bundled, consumed, left, session };
      });

      processedItems.push({
        type: "deal",
        name: dealName,
        price: dealPrice,
        children: kids,
      });
    } else if (item.item_group_name && item.item_group_name.trim()) {
      const groupKey = item.item_group_name.trim();
      const cleanItemName = (item.name || item.product_name || "Service")
        .replace(new RegExp(`^${groupKey}\\s*-\\s*`, "i"), "")
        .trim();
      const itemTotal = Number(
        item.total_price !== undefined
          ? item.total_price
          : Number(item.unit_price || 0) * (item.quantity || 1)
      );
      const bundled = Number(item.sessions_allowed || item.quantity || 1);
      const consumed = Number(item.sessions_consumed || 1);
      const left = Math.max(0, bundled - consumed);

      if (dealMap.has(groupKey)) {
        const existingDeal = dealMap.get(groupKey)!;
        existingDeal.price += itemTotal;
        existingDeal.children.push({
          name: cleanItemName,
          bundled,
          consumed,
          left,
          session: consumed,
        });
      } else {
        const newDeal: ProcessedDeal = {
          type: "deal",
          name: groupKey,
          price: itemTotal,
          children: [
            {
              name: cleanItemName,
              bundled,
              consumed,
              left,
              session: consumed,
            },
          ],
        };
        dealMap.set(groupKey, newDeal);
        processedItems.push(newDeal);
      }
    } else {
      const itemName = item.name || item.product_name || "Service";
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price !== undefined ? item.unit_price : item.price || 0);
      const totalPrice = Number(item.total_price !== undefined ? item.total_price : unitPrice * qty);
      const allowed = Number(item.sessions_allowed) || 1;
      const consumed = Number(item.sessions_consumed) || 1;

      processedItems.push({
        type: "standalone",
        name: itemName,
        qty,
        unit_price: unitPrice,
        total_price: totalPrice,
        note: item.note,
        sessions_allowed: allowed,
        sessions_consumed: consumed,
      });
    }
  });

  // Calculate financial totals
  const calculatedGross = processedItems.reduce((acc, it) => {
    return acc + (it.type === "deal" ? it.price : it.total_price);
  }, 0);

  const grossTotal = Number(data.subtotal !== undefined ? data.subtotal : calculatedGross);
  const discount = Number(
    data.discount !== undefined ? data.discount : data.discountAmount || 0
  );
  const payable = Number(
    data.grandTotal !== undefined ? data.grandTotal : Math.max(0, grossTotal - discount)
  );
  const paid = Number(data.paidAmount || 0);
  const balanceDue = Number(
    data.balanceDue !== undefined ? data.balanceDue : Math.max(0, payable - paid)
  );

  const remainingDebt = Number(
    data.remainingDue !== undefined
      ? data.remainingDue
      : data.customer?.current_balance !== undefined
        ? data.customer.current_balance
        : 0
  );

  const statusText =
    balanceDue <= 0 ? "Fully paid" : paid > 0 ? "Partially paid" : "Unpaid";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice - ${escapeHtml(data.invoiceNumber)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { margin: 0; padding: 0; height: auto; }
  body { background: #dcdcdc; font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #000;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .receipt { width: 80mm; margin: 0 auto; padding: 2mm 3.5mm; background: #fff; font-size: 12px; line-height: 1.3; }
  .hide { display: none !important; }

  /* ---------- Header ---------- */
  .head { text-align: center; }
  .head img { width: 22mm; height: auto; display: block; margin: 0 auto; object-fit: contain; }
  .head h1 { font-size: 18px; font-weight: 800; line-height: 1.15; margin-top: 1.2mm; text-transform: uppercase; letter-spacing: .3px; }
  .head p { font-size: 11px; margin-top: .8mm; color: #222; }

  /* ---------- Invoice bar (black strip) ---------- */
  .bar { display: flex; justify-content: space-between; align-items: center; gap: 2mm;
         margin-top: 3mm; padding: 1.6mm 2.5mm; background: #000; color: #fff; border-radius: 1.2mm; }
  .bar b { font-size: 13px; font-weight: 800; }
  .bar span { font-size: 10.5px; text-align: right; }

  /* ---------- Patient + token ---------- */
  .who { display: flex; gap: 3mm; margin-top: 3mm; align-items: stretch; }
  .who .left { flex: 1; min-width: 0; }
  .who .name { font-size: 16px; font-weight: 800; line-height: 1.15; word-break: break-word; }
  .kv { display: flex; gap: 2mm; font-size: 11.5px; margin-top: .7mm; }
  .kv i { font-style: normal; color: #555; width: 14mm; flex: none; }
  .kv span { font-weight: 600; min-width: 0; word-break: break-word; }
  .tok { flex: none; width: 24mm; background: #000; color: #fff; border-radius: 1.5mm; text-align: center;
         display: flex; flex-direction: column; justify-content: center; padding: 1.5mm 0; }
  .tok small { font-size: 10px; letter-spacing: 1px; }
  .tok strong { font-size: 26px; font-weight: 800; line-height: 1.05; }

  /* ---------- Dotted line (no border) ---------- */
  .dots { height: 1px; margin: 3mm 0 1mm; background-image: repeating-linear-gradient(90deg,#000 0 1px,transparent 1px 4px); }

  /* ---------- Items ---------- */
  .items-title { display: flex; justify-content: space-between; font-size: 11px; color: #555; padding-bottom: 1mm; }
  .item { padding: 1.4mm 0 1.6mm; background-image: repeating-linear-gradient(90deg,#000 0 1px,transparent 1px 4px);
          background-repeat: no-repeat; background-size: 100% 1px; background-position: bottom; }
  .item:last-child { background-image: none; }
  .item .n { font-size: 13px; font-weight: 700; word-break: break-word; }
  .item .note { font-size: 10.5px; color: #444; }
  .item .m { display: flex; justify-content: space-between; font-size: 11.5px; margin-top: .4mm; }
  .item .m em { font-style: normal; color: #444; }
  .item .m b { font-weight: 800; }

  .item .dealrow { display: flex; justify-content: space-between; gap: 2mm; font-size: 13px; font-weight: 800; }
  .item .dealrow span { min-width: 0; word-break: break-word; }
  .sub { margin-top: 1.2mm; padding-left: 1.5mm; }
  .sub .t { font-size: 11.5px; }
  .sub .t b { font-weight: 800; }
  .sub .s { font-size: 10px; color: #444; padding-left: 2.2mm; margin-bottom: .8mm; }

  /* ---------- Totals ---------- */
  .tot { margin-top: 1mm; }
  .tot .r { display: flex; justify-content: space-between; padding: .6mm 0; font-size: 12px; }
  .pay { display: flex; justify-content: space-between; align-items: center; margin: 1.5mm 0;
         padding: 1.8mm 2.5mm; background: #000; color: #fff; border-radius: 1.2mm; font-size: 15px; font-weight: 800; }
  .due { display: flex; justify-content: space-between; align-items: baseline; margin-top: .8mm; font-size: 15px; font-weight: 800; }
  .status { text-align: right; font-size: 10.5px; color: #333; margin-top: .3mm; }

  /* ---------- Footer ---------- */
  .thanks { text-align: center; font-style: italic; font-weight: 700; font-size: 12.5px; margin: 4mm 0 2mm; }
  .credit { text-align: center; font-size: 10px; line-height: 1.4; white-space: nowrap; }
  .credit b { font-weight: 800; }

  .no-print {
    width: 80mm;
    margin: 10px auto;
    text-align: center;
  }
  .btn-print {
    width: 100%;
    padding: 9px 16px;
    background: #000;
    color: #fff;
    font-weight: 700;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    letter-spacing: 0.3px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }
  .btn-print:hover {
    background: #222;
  }

  @media print {
    html, body { background: #fff !important; width: 80mm !important; margin: 0 !important; padding: 0 !important; }
    .receipt { margin: 0 !important; width: 80mm !important; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Click to Print Receipt</button>
</div>

<div class="receipt" id="receipt">

  <div class="head">
    ${clinicLogo ? `<img id="logo" src="${clinicLogo}" alt="Clinic Logo" />` : ""}
    <h1 id="clinicName">${clinicName}</h1>
    ${clinicLine ? `<p id="clinicLine">${clinicLine}</p>` : ""}
  </div>

  <div class="bar">
    <b id="inv">Invoice ${escapeHtml(data.invoiceNumber)}</b>
    <span id="date">${formattedDate}</span>
  </div>

  <div class="who">
    <div class="left">
      <div class="name" id="patient">${patientName}</div>
      ${patientPhone ? `<div class="kv" id="rPhone"><i>Phone</i><span id="pphone">${patientPhone}</span></div>` : ""}
      ${mrNo ? `<div class="kv" id="rMr"><i>MR No</i><span id="mr">${mrNo}</span></div>` : ""}
      <div class="kv" id="rVisit"><i>Visit No</i><span id="visit">${visitNo}</span></div>
      ${refBy ? `<div class="kv" id="rRef"><i>Ref by</i><span id="ref">${refBy}</span></div>` : ""}
    </div>
    <div class="tok" id="tokBox">
      <small>Token</small>
      <strong id="token">${tokenNumber}</strong>
    </div>
  </div>

  <div class="dots"></div>
  <div class="items-title"><span>Item</span><span>Amount</span></div>
  <div id="items">
    ${processedItems
      .map((it) => {
        if (it.type === "deal") {
          const dealTitle = escapeHtml(
            it.name + (/\(deal\)/i.test(it.name) ? "" : " (Deal)")
          );
          return `
            <div class="item">
              <div class="dealrow">
                <span>${dealTitle}</span>
                <span>${money(it.price)}</span>
              </div>
              ${it.children
                .map((k) => `
                  <div class="sub">
                    <div class="t">• <b>${escapeHtml(k.name)}</b>: Session ${k.session} of ${k.bundled} (${k.left} Remaining)</div>
                    <div class="s">Bundled: ${k.bundled} | Consumed: ${k.consumed} | Left: ${k.left}</div>
                  </div>
                `)
                .join("")}
            </div>
          `;
        } else {
          return `
            <div class="item">
              <div class="n">
                ${escapeHtml(it.name)}
                ${it.note ? `<div class="note">${escapeHtml(it.note)}</div>` : ""}
                ${
                  it.sessions_allowed && it.sessions_allowed > 1
                    ? `<div class="note">Session ${it.sessions_consumed || 1} of ${it.sessions_allowed} (${Math.max(0, it.sessions_allowed - (it.sessions_consumed || 1))} Remaining)</div>`
                    : ""
                }
              </div>
              <div class="m">
                <em>${it.qty} x ${money(it.unit_price)}</em>
                <b>${money(it.total_price)}</b>
              </div>
            </div>
          `;
        }
      })
      .join("")}
  </div>
  <div class="dots" style="margin-top:1mm"></div>

  <div class="tot">
    <div class="r"><span>Gross total</span><span id="gross">${money(grossTotal)}</span></div>
    ${
      discount > 0
        ? `<div class="r" id="rDisc"><span>Discount</span><span id="discount">(${money(discount)})</span></div>`
        : ""
    }
    ${
      remainingDebt > 0
        ? `<div class="r" id="rRem"><span>Remaining</span><span id="remaining">PKR ${money(remainingDebt)}</span></div>`
        : ""
    }
    <div class="pay"><span>Payable</span><span id="payable">${money(payable)}/-</span></div>
    <div class="r"><span>Paid</span><span id="paid">${money(paid)}</span></div>
    <div class="due"><span>Balance due</span><span id="balance">${money(Math.max(0, balanceDue))}</span></div>
    <div class="status" id="status">${statusText}</div>
  </div>

  <div class="thanks" id="thanks">${clinicThanks}</div>

  <div class="credit">
    Software Solution by <b>Falcon Swift Pvt. Ltd.</b><br>
    www.falconswift.online &nbsp;|&nbsp; 0320-8624173
  </div>

</div>

<script>
  window.addEventListener('load', function() {
    const img = document.getElementById("logo");
    const doPrint = () => setTimeout(() => window.print(), 200);
    if (img && img.src) {
      if (img.complete) {
        doPrint();
      } else {
        img.onload = img.onerror = doPrint;
      }
    } else {
      doPrint();
    }
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
    "width=420,height=750,menubar=no,toolbar=no,location=no,status=no"
  );
  if (!printWindow) {
    alert("Popup blocked! Please allow popups for this site to print thermal receipts.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}
