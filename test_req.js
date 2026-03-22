
const http = require("http");
http.get("http://localhost:3000/products/siyah-erkek-termal-iclik-tek-alt", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log("Status:", res.statusCode, "\nData:", data.substring(0, 1000)));
}).on("error", err => console.log("Error:", err.message));

