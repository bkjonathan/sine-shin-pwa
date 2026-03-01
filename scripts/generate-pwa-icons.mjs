#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sourceIcon = path.resolve(projectRoot, "src/assets/logo.png");
const outputDir = path.resolve(projectRoot, "public/icons");
const tempDir = path.resolve(projectRoot, "public/icons/.tmp");

const iconSizes = [16, 32, 48, 64, 72, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512];
const maskableSizes = [192, 512];

function runSips(args) {
  execFileSync("sips", args, { stdio: "inherit" });
}

function iconPath(filename) {
  return path.resolve(outputDir, filename);
}

if (!existsSync(sourceIcon)) {
  console.error(`Source icon not found: ${sourceIcon}`);
  process.exit(1);
}

try {
  execFileSync("sips", ["--help"], { stdio: "ignore" });
} catch {
  console.error("The `sips` command is required to generate icons. Run this script on macOS.");
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });

for (const size of iconSizes) {
  const output = iconPath(`icon-${size}x${size}.png`);
  runSips(["-s", "format", "png", "--resampleHeightWidth", `${size}`, `${size}`, sourceIcon, "--out", output]);
}

for (const size of maskableSizes) {
  const innerSize = Math.floor(size * 0.8);
  const resized = path.resolve(tempDir, `resized-${size}.png`);
  const output = iconPath(`icon-maskable-${size}x${size}.png`);

  runSips([
    "-s",
    "format",
    "png",
    "--resampleHeightWidth",
    `${innerSize}`,
    `${innerSize}`,
    sourceIcon,
    "--out",
    resized,
  ]);

  runSips([
    "-s",
    "format",
    "png",
    "--padColor",
    "3B82F6",
    "--padToHeightWidth",
    `${size}`,
    `${size}`,
    resized,
    "--out",
    output,
  ]);
}

runSips(["-s", "format", "png", "--resampleHeightWidth", "180", "180", sourceIcon, "--out", iconPath("apple-touch-icon-180x180.png")]);
runSips(["-s", "format", "png", "--resampleHeightWidth", "32", "32", sourceIcon, "--out", iconPath("favicon-32x32.png")]);
runSips(["-s", "format", "png", "--resampleHeightWidth", "16", "16", sourceIcon, "--out", iconPath("favicon-16x16.png")]);

rmSync(tempDir, { recursive: true, force: true });
console.log(`PWA icons generated in: ${outputDir}`);
