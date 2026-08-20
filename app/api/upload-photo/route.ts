// mathlab/app/api/upload-photo/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Save locally in public/uploads for local preview / fallback
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || ".jpg";
    const filename = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const localFilePath = path.join(uploadsDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    const localUrl = `/uploads/${filename}`;

    // 2. Upload to free public image host (tmpfiles.org) so D-ID API can access it over HTTP/HTTPS
    let publicUrl = "";
    try {
      const publicHostRes = await uploadToPublicHost(buffer, filename, file.type || "image/jpeg");
      if (publicHostRes) {
        publicUrl = publicHostRes;
      }
    } catch (err) {
      console.warn("Public image host upload failed, relying on local URL:", err);
    }

    return NextResponse.json({
      success: true,
      localUrl,
      publicUrl: publicUrl || localUrl,
      filename,
    });
  } catch (err: any) {
    console.error("Upload photo error:", err);
    return NextResponse.json({ error: err.message || "Failed to save uploaded photo" }, { status: 500 });
  }
}

async function uploadToPublicHost(buffer: Buffer, filename: string, mimeType: string): Promise<string | null> {
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([Buffer.from(head), buffer, Buffer.from(tail)]);

  const res = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) return null;
  const json = await res.json();
  if (json?.status === "success" && json?.data?.url) {
    // tmpfiles.org returns e.g. "https://tmpfiles.org/12345/file.jpg"
    // Direct link is "https://tmpfiles.org/dl/12345/file.jpg"
    return json.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
  }

  return null;
}
