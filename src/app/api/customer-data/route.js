import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export const GET = async () => {
    try {
        // Call Pathao API
        const res = await fetch("https://merchant.pathao.com/api/v1/orders/all?transfer_status=4&order_status=17&archive=0&page=1&limit=3198", {
            headers: {
                Authorization: `Bearer ${process.env.PATHAO_TOKEN}` // if needed
            }
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch from Pathao: ${res.statusText}`)
        }

        const result = await res.json()

        const orders = result.data?.data || []

        // Extract recipient_name and recipient_phone
        const simplified = orders.map(order => ({
            name: order.recipient_name || "",
            phone: order.recipient_phone || ""
        }))

        // Convert to Excel
        const worksheet = XLSX.utils.json_to_sheet(simplified)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "PathaoContactsPartial")

        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": "attachment; filename=pathao_contacts.xlsx"
            }
        })
    } catch (error) {
        console.error("Export error:", error)
        return NextResponse.json(
            { error: "Failed to generate Excel file", details: error.message },
            { status: 500 }
        )
    }
}
