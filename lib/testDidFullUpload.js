const https = require("https");
const fs = require("fs");
const path = require("path");

const apiKey = "Z29vZ2xlLW9hdXRoMnwxMDAwMDM1NTA5ODk0NTA1NTYzMjNAYWtfTlk1OHlvaWpRcFpPWFctQmhvdE10:Mv2A0rStpxEtvfbGeaPd8";
const basicAuth = Buffer.from(apiKey).toString("base64");

async function uploadImageToDid(imageBuffer, filename = "teacher.jpg") {
  return new Promise((resolve, reject) => {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const tail = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([Buffer.from(head), imageBuffer, Buffer.from(tail)]);

    const req = https.request("https://api.d-id.com/images", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + basicAuth,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const json = JSON.parse(data);
          console.log("Uploaded to D-ID S3:", json.url);
          resolve(json.url);
        } else {
          reject(new Error(`D-ID image upload failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Download sample 300x300 face image to test
const imgUrl = "https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg";
https.get(imgUrl, res => {
  const chunks = [];
  res.on("data", c => chunks.push(c));
  res.on("end", async () => {
    const buffer = Buffer.concat(chunks);
    try {
      const s3Url = await uploadImageToDid(buffer);
      console.log("SUCCESS! Photo uploaded directly to D-ID S3 bucket:", s3Url);
    } catch (e) {
      console.error("Upload error:", e);
    }
  });
});
