const http = require("http");

const port = process.env.PORT || 3000;
const environment = process.env.APP_ENV || "local";

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`Learning DevOps - Session 06\nEnvironment: ${environment}`);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});