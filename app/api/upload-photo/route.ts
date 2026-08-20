// mathlab/app/api/upload-photo/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    let buffer: Buffer;
    let filename = `avatar_${Date.now()}.jpg`;
    let mimeType = "image/jpeg";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      filename = file.name || filename;
      mimeType = file.type || mimeType;
    } else {
      const { imageBase64, imageUrl } = await req.json();
      if (imageUrl) {
        const fetchRes = await fetch(imageUrl);
        const arrayBuf = await fetchRes.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } else if (imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        buffer = Buffer.from(base64Data, "base64");
      } else {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
    }

    // 1. Save locally in public/uploads for local preview / fallback
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeFilename = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
    const localFilePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(localFilePath, buffer);
    const localUrl = `/uploads/${safeFilename}`;

    // 2. Upload photo directly to D-ID API's S3 storage (/images)
    let dIdS3Url = "";
    const apiKey = process.env.DID_API_KEY;

    if (apiKey && apiKey !== "paste_your_key_here") {
      try {
        dIdS3Url = await uploadToDidApi(buffer, safeFilename, apiKey);
        console.log("Successfully uploaded photo to D-ID S3:", dIdS3Url);
      } catch (err: any) {
        console.warn("Failed to upload image to D-ID S3:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      localUrl,
      publicUrl: dIdS3Url || localUrl,
      dIdS3Url,
    });
  } catch (err: any) {
    console.error("Upload photo error:", err);
    return NextResponse.json({ error: err.message || "Failed to save uploaded photo" }, { status: 500 });
  }
}

async function uploadToDidApi(buffer: Buffer, filename: string, apiKey: string): Promise<string> {
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([Buffer.from(head), buffer, Buffer.from(tail)]);
  const basicAuth = Buffer.from(apiKey).toString("base64");

  const res = await fetch("https://api.d-id.com/images", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  const resText = await res.text();
  if (!res.ok) {
    throw new Error(`D-ID image upload API error ${res.status}: ${resText}`);
  }

  const json = JSON.parse(resText);
  if (!json.url) {
    throw new Error("D-ID image upload response missing url field");
  }

  return json.url;
}
