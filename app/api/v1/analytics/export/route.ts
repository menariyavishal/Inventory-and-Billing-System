import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days") || "30";
    const days = parseInt(daysParam);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        customer: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Define columns keys and headers
    worksheet.columns = [
      { header: "Bill Number", key: "billNumber" },
      { header: "Date", key: "date" },
      { header: "Customer Name", key: "customerName" },
      { header: "Customer Phone", key: "customerPhone" },
      { header: "Payment Mode", key: "paymentMode" },
      { header: "Subtotal (Rs.)", key: "subtotal" },
      { header: "Discount (Rs.)", key: "discount" },
      { header: "Grand Total (Rs.)", key: "grandTotal" },
      { header: "Billed By", key: "billedBy" },
    ];

    // Add rows from DB query
    bills.forEach((b) => {
      worksheet.addRow({
        billNumber: b.billNumber,
        date: new Date(b.createdAt),
        customerName: b.customer?.name || "Guest",
        customerPhone: b.customer?.phone || "-",
        paymentMode: b.paymentMode.toUpperCase(),
        subtotal: b.subtotal,
        discount: b.discount,
        grandTotal: b.totalAmount,
        billedBy: b.user.name,
      });
    });

    // Style the Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" }, // Royal blue background
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 25;

    // Apply formatting and alignment dynamically per column type
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header formatting here
      row.height = 20; // Taller cells for clean vertical alignment
      row.font = { name: "Arial", size: 10 };

      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: "middle" }; // Vertical center for all cells

        const colKey = worksheet.columns[colNumber - 1].key;

        if (colKey === "billNumber") {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "0";
        } else if (colKey === "date") {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "yyyy-mm-dd hh:mm"; // Date format
        } else if (colKey === "customerName" || colKey === "billedBy") {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else if (colKey === "customerPhone") {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "@"; // Text format (stops scientific notation in Excel)
          if (cell.value && cell.value !== "-") {
            cell.value = cell.value.toString(); // Ensure string type
          }
        } else if (colKey === "paymentMode") {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (colKey === "subtotal" || colKey === "discount" || colKey === "grandTotal") {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.numFmt = "₹#,##0.00"; // Indian Rupee styling
        }
      });
    });

    // Calculate column widths dynamically based on length of maximum field value
    worksheet.columns.forEach((column) => {
      let maxLen = column.header ? column.header.length : 10;

      column.eachCell?.((cell, rowNumber) => {
        if (rowNumber === 1) return; // Skip header cell
        let valStr = "";
        if (cell.value !== null && cell.value !== undefined) {
          if (cell.value instanceof Date) {
            valStr = "yyyy-mm-dd hh:mm".length.toString(); // Fixed Date len
          } else {
            valStr = cell.value.toString();
          }
        }
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });

      column.width = maxLen + 5; // Add extra padding dynamically for clear visibility
    });

    // Write buffer and stream to client
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=sales_report_${days}days.xlsx`,
      },
    });
  } catch (error) {
    console.error("Error exporting excel:", error);
    return new Response("Failed to export sales data", { status: 500 });
  }
}
