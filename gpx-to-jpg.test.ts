#!/usr/bin/env -S deno test --allow-net --allow-read --allow-write --allow-run

// gpx-to-jpg.test.ts
import { gpxToJpg } from "./gpx-to-jpg.ts";
import { assertEquals, assert } from "@std/assert";
import { join } from "@std/path";
import { getImageInfo } from "@retraigo/image-size";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

let outputDir: string;
let output: string;

beforeAll(async () => {
  const input = join(Deno.cwd(), "sample", "sample.gpx");
  outputDir = await Deno.makeTempDir();
  output = join(outputDir, "sample.test.jpg");
  await gpxToJpg(input, output);
});

afterAll(async () => {
  await Deno.remove(outputDir, { recursive: true });
});

describe("gpxToJpg", () => {
  it("should create a non-empty JPEG with expected dimensions and text", async () => {
    const fileInfo = await Deno.stat(output);
    assert(fileInfo.size > 0, "Output JPEG should not be empty");

    const imgInfo = getImageInfo(await Deno.readFile(output));
    assertEquals(imgInfo.width, 3840);
    assertEquals(imgInfo.height, 2400);

    const proc = new Deno.Command("tesseract", { args: [output, "stdout", "-l", "por"], stdout: "piped", stderr: "piped" });
    const out = await proc.output();
    const ocrText = new TextDecoder().decode(out.stdout).toLowerCase().replace(/[\n\r]+/g, " ");

    assert(ocrText.match(/pico.*do.*gaspar/), `Found 'Pico do Gaspar' in the image text '${ocrText}'.`);
  });
});
