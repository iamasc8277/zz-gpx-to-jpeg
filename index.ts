import gpxToJpg from './lib/gpx-to-jpg.js';

// chromium (or chrome) and chromedriver need to be installed
process.on('SIGINT', () => process.exit());
await gpxToJpg(process.argv[2]);

