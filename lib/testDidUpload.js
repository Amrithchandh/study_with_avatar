const https = require("https");

const apiKey = "Z29vZ2xlLW9hdXRoMnwxMDAwMDM1NTA5ODk0NTA1NTYzMjNAYWtfTlk1OHlvaWpRcFpPWFctQmhvdE10:Mv2A0rStpxEtvfbGeaPd8";
const basicAuth = Buffer.from(apiKey).toString("base64");

// 1x1 JPG buffer test
const sampleJpg = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=", "base64");

function testImagesUpload() {
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([Buffer.from(head), sampleJpg, Buffer.from(tail)]);

  const req = https.request("https://api.d-id.com/images", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + basicAuth,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    }
  }, res => {
    let responseText = "";
    res.on("data", c => responseText += c);
    res.on("end", () => {
      console.log("D-ID /images Upload Response Status:", res.statusCode);
      console.log("D-ID /images Upload Response Body:", responseText);
    });
  });

  req.write(body);
  req.end();
}

testImagesUpload();
