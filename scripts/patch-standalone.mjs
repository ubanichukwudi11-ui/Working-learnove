import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneServerPath = path.join(standaloneDir, "server.js");

if (!fs.existsSync(standaloneServerPath)) {
  process.exit(0);
}

let content = fs.readFileSync(standaloneServerPath, "utf8");

const hostLineRegex = /^const hostname = process\.env\.HOSTNAME \|\| ['"]0\.0\.0\.0['"]$/m;
const replacement = [
  "const rawHostname = (process.env.HOSTNAME || process.env.HOST || '').trim()",
  "const hostname = (rawHostname === '0.0.0.0' || rawHostname === '127.0.0.1' || rawHostname === 'localhost' || rawHostname === '::' || rawHostname === '::1') ? rawHostname : '0.0.0.0'",
].join("\n");

if (hostLineRegex.test(content)) {
  content = content.replace(hostLineRegex, replacement);
  fs.writeFileSync(standaloneServerPath, content, "utf8");
  console.log("> Patched .next/standalone/server.js hostname binding to 0.0.0.0 fallback");
} else if (!content.includes("rawHostname")) {
  // Fallback injection if Next.js changes standalone template formatting
  content = content.replace(
    /process\.env\.HOSTNAME/g,
    "((process.env.HOSTNAME === '0.0.0.0' || process.env.HOSTNAME === '127.0.0.1' || process.env.HOSTNAME === 'localhost' || process.env.HOSTNAME === '::' || process.env.HOSTNAME === '::1') ? process.env.HOSTNAME : '0.0.0.0')"
  );
  fs.writeFileSync(standaloneServerPath, content, "utf8");
  console.log("> Applied safe HOSTNAME guard to .next/standalone/server.js");
}

const staticSrc = path.join(rootDir, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
}

const publicSrc = path.join(rootDir, "public");
const publicDest = path.join(standaloneDir, "public");
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
}
