import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { remote } from 'webdriverio';
import express from 'express';
import HttpTerminator from 'http-terminator';
import getPort from 'get-port';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export default async (file: string): Promise<void> => {
  file = path.resolve(file);
  
  const tmpdir = path.resolve(os.tmpdir(), uuidv4());
  const tempfile = path.resolve(tmpdir, 'tmp.gpx');
  const port = await getPort();
  const url = `http://localhost:${port}/static/gpx.html`;
  const httpTerminator = HttpTerminator.createHttpTerminator({
    server: express()
      .use('/static', express.static(path.resolve('static')))
      .use('/tmp', express.static(tmpdir))
      .listen(port)
  });

  const browser = await remote({
    capabilities: { 
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: [
          '--headless',
          '--kiosk'
        ],
        prefs: {
          'layout.css.devPixelsPerPx': '2.0',
          'browser.cache.disk.enable': false,
          'browser.cache.memory.enable': false,
          'browser.cache.offline.enable': false,
          'network.http.use-cache': false
        }
      }
    }
  });

  try {
    await fs.mkdir(tmpdir);
    await fs.copyFile(file, tempfile);
    await browser.setWindowSize(1920, 1200);
    await browser.url(url);
    await new Promise((resolve) => { setTimeout(resolve, 20000); });
    const screenshot = await browser.takeScreenshot();
    await sharp(Buffer.from(screenshot, 'base64')).jpeg({ mozjpeg: true, quality: 75 }).toFile(`${file}.jpg`);
  } finally {
    try { await fs.rm(tmpdir, { recursive: true, force: true }); } catch (e) {
      console.error(e);
    }
    await Promise.all([
      httpTerminator.terminate(),
      browser.deleteSession()
    ]);
  }  
}
