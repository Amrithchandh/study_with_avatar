const https = require("https");

const apiKey = "Z29vZ2xlLW9hdXRoMnwxMDAwMDM1NTA5ODk0NTA1NTYzMjNAYWtfTlk1OHlvaWpRcFpPWFctQmhvdE10:Mv2A0rStpxEtvfbGeaPd8";
const basicAuth = Buffer.from(apiKey).toString("base64");

async function testUrl(imageUrl) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      source_url: imageUrl,
      script: {
        type: "text",
        input: "Welcome class to MathLab!",
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
        console.log(`URL: ${imageUrl}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}\n`);
        resolve(res.statusCode);
      });
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  await testUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Portrait_Placeholder.png/600px-Portrait_Placeholder.png");
  await testUrl("https://i.imgur.com/7b44781.jpg");
  await testUrl("https://cdn.pixabay.com/photo/2015/01/08/18/09/guy-593327_1280.jpg");
  await testUrl("https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg");
}

run();
