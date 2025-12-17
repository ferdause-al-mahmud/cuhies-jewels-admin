import { NextResponse } from "next/server";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

// REQUIRED for file uploads
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files");

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, msg: "No files uploaded" });
        }

        const uploadDir = "/var/www/customer/public/uploads";

        // Ensure folder exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const results = [];

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const id = uuidv4();
            const fileName = `${id}.webp`;
            const filePath = path.join(uploadDir, fileName);

            const optimizedImage = await sharp(buffer)
                .webp()
                .toBuffer();

            fs.writeFileSync(filePath, optimizedImage);

            const publicUrl = `https://cuhiesjewels.com.bd/uploads/${fileName}`;

            results.push({ url: publicUrl, fileName });
        }

        return NextResponse.json({ success: true, files: results });
    } catch (err) {
        console.error("UPLOAD ERROR:", err);
        return NextResponse.json(
            { success: false, msg: err.message },
            { status: 500 }
        );
    }
}
