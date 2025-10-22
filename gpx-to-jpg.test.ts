#!/usr/bin/env -S deno test --allow-net --allow-read --allow-write --allow-run

// gpx-to-jpg.test.ts
import { gpxToJpg } from "./gpx-to-jpg.ts";
import { assertEquals, assert } from "@std/assert";
import { join } from "@std/path";
import { getImageInfo } from "@retraigo/image-size";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { createWorker } from "tesseract.js";

const input = join(Deno.cwd(), "test", "sample.test.gpx");
const output = join(Deno.cwd(), "test", "sample.test.jpg");;

beforeAll(async () => {
  try { await Deno.remove(output); } catch {  /* ignore */ }
  await gpxToJpg(input, output, { delay: 10000 });
});

describe("gpxToJpg", () => {
  it("should create a non-empty JPEG with expected dimensions and text", async () => {
    const fileInfo = await Deno.stat(output);
    assert(fileInfo.size > 0, "Output JPEG should not be empty");

    const imgInfo = getImageInfo(await Deno.readFile(output));
    assertEquals(imgInfo.width, 3840);
    assertEquals(imgInfo.height, 2400);

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(output);
    await worker.terminate();
    const ocrText = text.toLowerCase().replace(/[\n\r]+/g, " ");
    assert(ocrText.match(/pico.*do.*gaspar/), `Found 'Pico do Gaspar' in the image text '${ocrText}'.`);
  });
});
