#!/usr/bin/env node

/**
 * Cross-platform setup script for TheHive Mission Control.
 * Validates environment and initializes the database directory.
 *
 * Works on Windows (CMD, PowerShell), macOS, and Linux.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const ENV_FILE = path.join(ROOT_DIR, ".env");
const ENV_EXAMPLE = path.join(ROOT_DIR, ".env.example");

const isWindows = process.platform === "win32";

function log(msg) {
  console.log(`[setup] ${msg}`);
}

function warn(msg) {
  console.warn(`[setup] WARNING: ${msg}`);
}

function error(msg) {
  console.error(`[setup] ERROR: ${msg}`);
}

// Check Node.js version
const [major] = process.versions.node.split(".").map(Number);
if (major < 18) {
  error(`Node.js 18+ is required. You have v${process.versions.node}`);
  process.exit(1);
}
log(`Node.js v${process.versions.node} - OK`);

// Create data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  log("Created data/ directory");
} else {
  log("data/ directory exists - OK");
}

// Check .env file
if (!fs.existsSync(ENV_FILE)) {
  if (fs.existsSync(ENV_EXAMPLE)) {
    fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
    log("Created .env from .env.example");
    warn("Edit .env and add your ANTHROPIC_API_KEY before running the app");
  } else {
    warn(".env.example not found - create .env manually with ANTHROPIC_API_KEY");
  }
} else {
  // Validate that ANTHROPIC_API_KEY is set
  const envContent = fs.readFileSync(ENV_FILE, "utf-8");
  if (
    envContent.includes("your_api_key_here") ||
    !envContent.includes("ANTHROPIC_API_KEY=")
  ) {
    warn(
      "ANTHROPIC_API_KEY is not configured in .env - the chat feature will not work"
    );
  } else {
    log(".env configured - OK");
  }
}

// Check better-sqlite3 native module
try {
  await import("better-sqlite3");
  log("better-sqlite3 native module - OK");
} catch (e) {
  error("better-sqlite3 failed to load. This is a native module that requires compilation.");
  if (isWindows) {
    console.error(`
=== Windows Setup Required ===
better-sqlite3 needs native build tools. Fix with ONE of these options:

Option 1 (Recommended): Install windows-build-tools
  npm install --global windows-build-tools

Option 2: Install Visual Studio Build Tools manually
  1. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
  2. Install "Desktop development with C++" workload
  3. Run: npm rebuild better-sqlite3

Option 3: Use prebuilt binaries
  npm install better-sqlite3 --build-from-source=false

After fixing, run: npm rebuild better-sqlite3
`);
  } else {
    console.error("Run: npm rebuild better-sqlite3");
    console.error("You may need build-essential and python3 installed.");
  }
  process.exit(1);
}

// Platform-specific notes
if (isWindows) {
  log("");
  log("=== Windows Notes ===");
  log("Start the app with: npm run dev");
  log("Open in browser: http://localhost:3000");
  log("If port 3000 is busy, change PORT in .env");
  log(
    "If you see EPERM errors, run your terminal as Administrator or check antivirus settings"
  );
}

log("");
log("Setup complete! Run 'npm run dev' to start TheHive.");
