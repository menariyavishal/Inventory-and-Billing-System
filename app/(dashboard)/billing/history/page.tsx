"use client";

import { useState, useEffect } from "react";
import { getBills, getBill } from "@/lib/api/billing";
import Link from "next/link";

function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const g = ["", "Thousand", "Lakh", "Crore"];

  const count = (n: number) => {
    let word = "";
    if (n < 20) {
      word = a[n];
    } else if (n < 100) {
      word = b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      word = a[Math.floor(n / 100)] + " Hundred " + count(n % 100);
    }
    return word.trim();
  };

  if (num === 0) return "Zero Rupees Only";

  let words = "";
  let temp = Math.floor(num);

  let chunks = [];
  chunks.push(temp % 1000);
  temp = Math.floor(temp / 1000);
  chunks.push(temp % 100);
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk > 0) {
      words = count(chunk) + " " + g[i] + " " + words;
    }
  }

  return (words.trim() + " Rupees Only").replace(/\s+/g, " ");
}

export default function BillingHistoryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, [search]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await getBills(search);
      setBills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBill = async (billId: number) => {
    try {
      const bill = await getBill(billId);
      if (!bill) return;

      // Import libraries dynamically to prevent Next.js SSR build errors
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      // Create a temporary element on the body to render the styled invoice
      const invoiceEl = document.createElement("div");
      invoiceEl.style.position = "absolute";
      invoiceEl.style.left = "-9999px";
      invoiceEl.style.top = "-9999px";
      invoiceEl.style.width = "650px";
      invoiceEl.style.padding = "0px";
      invoiceEl.style.margin = "0px";
      invoiceEl.style.boxSizing = "border-box";
      invoiceEl.style.background = "white";
      invoiceEl.style.color = "black";
      invoiceEl.style.fontFamily = "Arial, sans-serif";
      invoiceEl.style.fontSize = "11px";

      const itemsHtml = bill.billItems?.map((item: any, idx: number) => {
        const pName = item.product?.name || "";
        const pRate = item.unitPrice;
        const pQty = item.quantity;
        const pTotal = item.lineTotal;
        const imei = item.productUnit?.imeiNumber;

        return `
          <tr style="border-bottom: 1px solid #1b3f8b;">
            <td style="border-right: 1px solid #1b3f8b; padding: 6px; text-align: left;">${idx + 1}</td>
            <td style="border-right: 1px solid #1b3f8b; padding: 6px; text-align: left;">
              <div style="font-weight: bold; color: #1f2937;">${pName}</div>
              ${imei ? `<div style="font-size: 8px; color: #4b5563; font-weight: 600; margin-top: 2px;">IMEI: ${imei}</div>` : ""}
            </td>
            <td style="border-right: 1px solid #1b3f8b; padding: 6px; text-align: center; font-weight: bold;">${pQty}</td>
            <td style="border-right: 1px solid #1b3f8b; padding: 6px; text-align: right; font-weight: bold;">₹${pRate}</td>
            <td style="padding: 6px; text-align: right; font-weight: bold;">₹${pTotal}</td>
          </tr>
        `;
      }).join("") || "";

      // Fill remaining empty rows to maintain layout height
      const emptyCount = Math.max(0, 4 - (bill.billItems?.length || 0));
      const fillerHtml = Array.from({ length: emptyCount }).map(() => `
        <tr style="border-bottom: 1px solid #1b3f8b; height: 32px;">
          <td style="border-right: 1px solid #1b3f8b;"></td>
          <td style="border-right: 1px solid #1b3f8b;"></td>
          <td style="border-right: 1px solid #1b3f8b;"></td>
          <td style="border-right: 1px solid #1b3f8b;"></td>
          <td></td>
        </tr>
      `).join("");

      const words = numberToWords(parseFloat(bill.totalAmount));

      invoiceEl.innerHTML = `
        <div style="border: 3px solid #1b3f8b; padding: 16px; background: white; box-sizing: border-box; width: 100%;">
          <!-- Header info matching billing page color exactly -->
          <div style="border: 2px solid #1b3f8b; padding: 12px; margin-bottom: 12px; position: relative; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1b3f8b; padding-bottom: 6px; margin-bottom: 8px;">
              <div>
                <span style="background-color: #1b3f8b; text-transform: uppercase; font-size: 10px; color: white; padding: 4px 12px; font-weight: 800; letter-spacing: 0.5px; border-radius: 2px;">
                  Tax Invoice
                </span>
                ${bill.status === "voided" ? `
                  <span style="border: 1px solid red; color: red; padding: 2px 6px; font-weight: 800; text-transform: uppercase; font-size: 9px; margin-left: 8px; border-radius: 2px; background-color: #fef2f2;">
                    VOIDED / CANCELLED
                  </span>
                ` : ""}
              </div>
              <div style="text-align: right; color: #1b3f8b;">
                <span style="font-weight: 800; font-size: 11px; letter-spacing: 0.5px;">GSTIN : 08BROPM8088G2Z0</span>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 8px;">
              <!-- Logo icon of Lord Krishna flute/peacock feather -->
              <div style="flex-shrink: 0;">
                <svg viewBox="0 0 64 64" style="width: 56px; height: 56px; color: #1b3f8b;" stroke="currentColor" stroke-width="1.5" fill="none">
                  <path d="M30 38 C32 30, 38 18, 48 10 C54 18, 52 30, 42 36 C38 38, 34 39, 30 38 Z" fill="#1b3f8b" fill-opacity="0.2" />
                  <path d="M34 34 C36 28, 40 20, 46 15 C50 20, 48 28, 42 32 C38 34, 36 34, 34 34 Z" fill="#1b3f8b" fill-opacity="0.5" />
                  <path d="M37 31 C38 27, 41 23, 44 20 C46 23, 44 27, 41 28 Z" fill="#1b3f8b" />
                  <path d="M25 42 C22 32, 12 20, 6 20" />
                  <line x1="4" y1="58" x2="60" y2="22" stroke-width="2" stroke-linecap="round" />
                  <circle cx="14" cy="52" r="1.5" fill="currentColor" />
                  <circle cx="22" cy="47" r="1.5" fill="currentColor" />
                  <circle cx="30" cy="42" r="1.5" fill="currentColor" />
                  <circle cx="38" cy="37" r="1.5" fill="currentColor" />
                  <circle cx="46" cy="32" r="1.5" fill="currentColor" />
                </svg>
              </div>

              <div style="text-align: center; flex: 1;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #1b3f8b; letter-spacing: -0.5px;">
                  Shree Krishna Computer
                </h1>
                <p style="margin: 3px 0 0 0; font-size: 10px; color: #374151; font-weight: bold;">
                  Main Bus Stand Kanore, Distt. Udaipur
                </p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #374151; font-weight: bold;">
                  ✉ s.krishnacom.kanore@gmail.com
                </p>
              </div>
              <div style="width: 56px;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #1b3f8b; padding-top: 6px; font-size: 9px; font-weight: 900; color: white; background-color: #1b3f8b; padding: 2px 6px; border-radius: 2px;">
              <div>WE BELIEVE IN QUALITY</div>
              <div style="display: flex; gap: 6px;">
                <span>MOBILE</span>|<span>COMPUTER</span>|<span>AC</span>|<span>CCTV</span>|<span>LEDTV</span>|<span>REFRIGERATOR</span>|<span>WASHING MACHINE</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; border-top: 1px solid #1b3f8b; padding-top: 6px; margin-top: 6px; font-size: 10px; font-weight: 900; color: #1b3f8b;">
              <div>Owner: Lalit Menariya</div>
              <div>📞 9928203203</div>
            </div>
          </div>

          <!-- Customer Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #1b3f8b; margin-bottom: 12px; font-size: 10px; box-sizing: border-box;">
            <div style="padding: 8px; border-right: 1px solid #1b3f8b; display: flex; flex-direction: column; justify-content: space-between; min-height: 50px; box-sizing: border-box;">
              <div>
                <span style="font-weight: 800; color: #1b3f8b;">M/s. </span>
                <span style="text-decoration: underline; font-weight: bold; color: #1f2937;">
                  ${bill.customer?.name || "Guest Customer"}
                </span>
              </div>
              ${bill.customer?.phone ? `
                <div style="margin-top: 4px;">
                  <span style="font-weight: 800; color: #1b3f8b;">Phone: </span>
                  <span style="font-weight: bold; color: #1f2937;">${bill.customer.phone}</span>
                </div>
              ` : ""}
            </div>
            <div style="padding: 8px; display: flex; flex-direction: column; justify-content: space-between; min-height: 50px; box-sizing: border-box;">
              <div>
                <span style="font-weight: 800; color: #1b3f8b;">Bill No. </span>
                <span style="color: red; font-weight: 800; margin-left: 4px;">${bill.billNumber}</span>
              </div>
              <div style="margin-top: 4px;">
                <span style="font-weight: 800; color: #1b3f8b;">Date: </span>
                <span style="font-weight: bold; color: #1f2937;">${new Date(bill.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #1b3f8b; margin-bottom: 12px; font-size: 10px; box-sizing: border-box;">
            <thead>
              <tr style="border-bottom: 1px solid #1b3f8b; background-color: rgba(27, 63, 139, 0.05); color: #1b3f8b; font-weight: 800;">
                <th style="border-right: 1px solid #1b3f8b; padding: 6px; text-align: left; width: 40px;">No.</th>
                <th style="border-right: 1px solid #1b3f8b; padding: 6px; text-align: left;">Particulars</th>
                <th style="border-right: 1px solid #1b3f8b; padding: 6px; text-align: center; width: 48px;">Qty.</th>
                <th style="border-right: 1px solid #1b3f8b; padding: 6px; text-align: right; width: 80px;">Rate</th>
                <th style="padding: 6px; text-align: right; width: 96px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${fillerHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; font-size: 10px; box-sizing: border-box;">
            <div>
              <div style="border: 1px solid #1b3f8b; padding: 8px; font-size: 8px; line-height: 1.4; color: #1f2937; box-sizing: border-box; min-height: 85px;">
                <div style="font-weight: 900; color: #1b3f8b; text-decoration: underline; margin-bottom: 4px; text-transform: uppercase;">Bank Details:</div>
                <div>Bank : <span style="font-weight: bold;">State Bank of India</span></div>
                <div>IFSE : <span style="font-weight: bold;">SBIN0032015</span></div>
                <div>A/c No. : <span style="font-weight: bold;">61181530264</span></div>
                <div>A/c No. : <span style="font-weight: bold;">61130908984</span></div>
              </div>
            </div>

            <div style="border: 1px solid #1b3f8b; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; padding: 4px 6px; border-bottom: 1px solid #1b3f8b;">
                <span style="font-weight: bold; color: #1b3f8b;">Total</span>
                <span style="font-weight: bold;">₹${bill.subtotal}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 6px; border-bottom: 1px solid #1b3f8b;">
                <span style="font-weight: bold; color: #1b3f8b;">CGST</span>
                <span>-</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 6px; border-bottom: 1px solid #1b3f8b;">
                <span style="font-weight: bold; color: #1b3f8b;">SGST</span>
                <span>-</span>
              </div>
              ${bill.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 4px 6px; border-bottom: 1px solid #1b3f8b; color: red; background-color: rgba(239, 68, 68, 0.05);">
                  <span style="font-weight: bold;">Discount</span>
                  <span style="font-weight: bold;">- ₹${bill.discount}</span>
                </div>
              ` : ""}
              <div style="display: flex; justify-content: space-between; padding: 6px; font-weight: 900; background-color: rgba(27, 63, 139, 0.05); color: #1b3f8b; font-size: 12px;">
                <span>G.Total</span>
                <span>₹${bill.totalAmount}</span>
              </div>
            </div>
          </div>

          <!-- Words -->
          <div style="margin-bottom: 20px; font-size: 10px;">
            <span style="font-weight: 800; color: #1b3f8b;">Rs. (In Word): </span>
            <span style="font-style: italic; text-decoration: underline; font-weight: bold; color: #1f2937;">
              ${words}
            </span>
          </div>

          <!-- Signatures -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; font-size: 10px; color: #1b3f8b;">
            <div style="text-align: center; width: 128px; border-top: 1px solid #1b3f8b; padding-top: 4px; font-weight: bold;">
              Cust.Signature
            </div>
            <div style="text-align: center; width: 192px;">
              <div style="font-size: 9px; font-weight: 900; margin-bottom: 24px;">For-SHREE KRISHNA COMPUTER</div>
              <div style="border-top: 1px solid #1b3f8b; padding-top: 4px; font-weight: bold;">
                Auth.Signature
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(invoiceEl);

      // Render elements via html2canvas with scale multiplier for high-def PDF quality
      const canvas = await html2canvas(invoiceEl, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(invoiceEl);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Calculate dynamic image dimensions to scale perfectly onto standard A4 page with margins
      const imgWidth = pdfWidth - 20; // 10mm margins on left and right
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`SKC_Invoice_${bill.billNumber}.pdf`);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF bill details.");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Billing History</h2>
        <Link
          href="/billing"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
        >
          New Transaction
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Bill Number, Customer Name or Phone..."
          className="w-full border border-gray-300 rounded px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10">Loading transactions...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    #{bill.billNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bill.customer?.name || "Guest"}</div>
                    {bill.customer?.phone && <div className="text-xs text-gray-500">{bill.customer.phone}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₹{bill.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {bill.paymentMode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bill.status === "voided" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link
                      href={`/billing/${bill.id}`}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                      title="View Details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDownloadBill(bill.id)}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                      title="Download Bill"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
