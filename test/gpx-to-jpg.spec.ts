import { assert } from 'chai';
import { promises as fs } from 'fs';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import gpxToJpg from '../lib/gpx-to-jpg.js';

const testGpxFilename = './tmp/sample.gpx';
const testJpgFilename = `${testGpxFilename}.jpg`;

describe('Sample gpx test', () => {

  // work in clean tmp directory
  before(async() => {
    await fs.rm('./tmp', { recursive: true, force: true });
    await fs.mkdir('./tmp');
    await fs.cp('./sample/sample.gpx', testGpxFilename);
  });

  after(async () => {
    await fs.rm('./tmp', { recursive: true, force: true });
  });

  it('should create a valid jpg', async () => {
    // check  file
    await gpxToJpg(testGpxFilename);
    const stat = await fs.stat(testJpgFilename);
    assert(stat.isFile(), 'file written');

    // check image dimensions
    const { width, height } = await sharp(testJpgFilename).metadata();

    assert(width === 3840, 'map has the right width');
    assert(height === 2400, 'map has the right height');

    // check content
    const worker = await createWorker('por');
    let text = '';
    try {
      ({ data: { text } } = await worker.recognize('./tmp/sample.gpx.jpg'));
    } finally {
      await worker.terminate();
    }
    text = text.replace(/(\n|\r)/gm, "");
    assert(text.match(/Pico/g), 'map has the location');
    assert(text.match(/3:49:42/g), 'map has the duration');
    assert(text.match(/11\.588/g), 'map has the length');
  });

});