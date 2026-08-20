const https = require("https");

const apiKey = "Z29vZ2xlLW9hdXRoMnwxMDAwMDM1NTA5ODk0NTA1NTYzMjNAYWtfTlk1OHlvaWpRcFpPWFctQmhvdE10:Mv2A0rStpxEtvfbGeaPd8";
const basicAuth = Buffer.from(apiKey).toString("base64");
const s3Url = "s3://d-id-images-prod/google-oauth2|100003550989450556323/img_38hr1ZO4J0RnXMOb8BrHm/teacher.jpg";

const payload = JSON.stringify({
  source_url: s3Url,
  script: {
    type: "text",
    input: "Welcome to class, I am your avatar teacher!",
    provider: { type: "microsoft", voice_id: "en-US-JennyNeural" }
  }
});

const req = https.request("https://api.d-id.com/talks", {
  method: "POST",
  headers: {
    "Authorization": "Basic " + basicAuth,
    "Content-Type": "application/json"
  }
}, res => {
  let body = "";
  res.on("data", c => body += c);
  res.on("end", () => {
    console.log("Talk Creation Status:", res.statusCode);
    console.log("Talk Creation Response:", body);
  });
});

req.write(payload);
req.end();
