const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("=== DEBUG: Current working directory:", process.cwd());
console.log("=== DEBUG: __dirname:", __dirname);
console.log("=== DEBUG: Files in cwd:", fs.readdirSync(process.cwd()).join(", "));

const nextDir = path.join(process.cwd(), ".next");
console.log("=== DEBUG: .next exists:", fs.existsSync(nextDir));
if (fs.existsSync(nextDir)) {
  console.log("=== DEBUG: .next contents:", fs.readdirSync(nextDir).join(", "));
  const staticDir = path.join(nextDir, "static");
  console.log("=== DEBUG: .next/static exists:", fs.existsSync(staticDir));
  if (fs.existsSync(staticDir)) {
    console.log("=== DEBUG: .next/static contents:", fs.readdirSync(staticDir).join(", "));
    const chunksDir = path.join(staticDir, "chunks");
    if (fs.existsSync(chunksDir)) {
      console.log("=== DEBUG: .next/static/chunks (first 5):", fs.readdirSync(chunksDir).slice(0, 5).join(", "));
    }
  }
}

const publicDir = path.join(process.cwd(), "public");
console.log("=== DEBUG: public exists:", fs.existsSync(publicDir));
if (fs.existsSync(publicDir)) {
  console.log("=== DEBUG: public contents:", fs.readdirSync(publicDir).join(", "));
}

console.log("=== STARTING Next.js ===");
execSync("npx next start -p 3000", { stdio: "inherit", env: { ...process.env, HOST: "0.0.0.0" } });
