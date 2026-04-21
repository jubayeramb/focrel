#!/usr/bin/env node
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const svgPath = resolve(process.argv[2] ?? "/tmp/focrel-icon/source.svg");
const outPath = resolve(process.argv[3] ?? "src-tauri/icons/icon-source.png");
const size = parseInt(process.argv[4] ?? "1024", 10);

const svg = readFileSync(svgPath, "utf8");
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: size },
  background: "rgba(0,0,0,0)",
});
const pngData = resvg.render().asPng();
writeFileSync(outPath, pngData);
console.log(`rendered ${size}x${size} → ${outPath} (${pngData.length} bytes)`);
