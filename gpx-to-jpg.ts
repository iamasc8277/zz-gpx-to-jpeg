#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-run

import { join, basename } from "@std/path";

export interface GpxToJpgOptions {
  delay?: number;
  width?: number;
  height?: number;
  quality?: number;
  deviceScaleFactor?: number;
}

export async function gpxToJpg(input: string, output: string, opts: GpxToJpgOptions = {}) {
  const { quality = 90, delay = 3000, width = 1920, height = 1200, deviceScaleFactor = 2 } = opts;

  const tmpDir = await Deno.makeTempDir();
  const tmpGpx = join(tmpDir, basename(input));
  await Deno.copyFile(input, tmpGpx);

  const port = 8000;
  const controller = new AbortController();
  Deno.serve({ port, signal: controller.signal }, async (req) => {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/static/")) {
      const filePath = join(Deno.cwd(), "static", url.pathname.substring(8));
      const body = await Deno.readFile(filePath);
      return new Response(body);
    } else if (url.pathname === `/tmp/tmp.gpx`) {
      const body = await Deno.readFile(tmpGpx);
      return new Response(body, { headers: { "content-type": "application/gpx+xml" } });
    }
    return new Response("404", { status: 404 });
  });

  const htmlUrl = `http://localhost:${port}/static/gpx.html`;

  const findBrowserBinary = async (): Promise<string> => {
    const names = ["chrome", "google-chrome", "chromium", "chromium-browser"];
    for (const name of names) {
      const { success } = await new Deno.Command("which", { args: [name], stdout: "piped", stderr: "null" }).output();
      if (success) {
        return name;
      }
    }
    throw new Error("No Chromium-based browser found in PATH.");
  }

  const browserBin = await findBrowserBinary();
  console.log(`Using browser binary: ${browserBin}`);

  const chromium = new Deno.Command(browserBin, {
    args: [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--remote-debugging-port=9222",
      `--window-size=${width},${height}`,
      `--force-device-scale-factor=${deviceScaleFactor}`,
      htmlUrl,
    ],
    stdout: "null",
    stderr: "inherit",
  }).spawn();

  await new Promise((res) => setTimeout(res, delay));

  const targetsResp = await fetch("http://localhost:9222/json");
  const targets = await targetsResp.json();
  const wsUrl = targets[0].webSocketDebuggerUrl!;
  const ws = new WebSocket(wsUrl);

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = (err) => reject(err);
  });

  let id = 1;

  ws.send(JSON.stringify({
    id: id++,
    method: "Emulation.setDeviceMetricsOverride",
    params: { width, height, deviceScaleFactor, mobile: false },
  }));

  ws.send(JSON.stringify({ id: id++, method: "Page.enable" }));
  ws.send(JSON.stringify({ id: id++, method: "Page.captureScreenshot", params: { format: "jpeg", quality } }));

  await new Promise<void>((resolve) => {
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.result?.data) {
        const bytes = Uint8Array.from(atob(data.result.data), (c) => c.charCodeAt(0));
        await Deno.writeFile(output, bytes);
        console.log(`Screenshot saved to ${output}`);

        ws.close();
        controller.abort();
        chromium.kill("SIGTERM");
        await chromium.status;
        resolve();
      }
    };
  });
}

if (import.meta.main) {
  const inputFile = Deno.args[0];
  if (!inputFile) {
    console.error(
      "Usage: gpx-to-jpg in.gpx [out.jpg]"
    );
    Deno.exit(1);
  }

  const outputFile = Deno.args[1] || inputFile.replace(/\.gpx$/i, ".jpg");

  await gpxToJpg(inputFile, outputFile);
}
