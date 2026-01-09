# zz-gpx-to-jpeg
[![test](https://github.com/iamasc8277/zz-gpx-to-jpeg/actions/workflows/build.yml/badge.svg)](https://github.com/iamasc8277/zz-gpx-to-jpeg/actions/workflows/build.yml)
&ensp; 
[![updated](https://github.com/iamasc8277/zz-gpx-to-jpeg/actions/workflows/update.yml/badge.svg)](https://github.com/iamasc8277/zz-gpx-to-jpeg/actions/workflows/update.yml)

Render a GPX track onto a map and capture it as a JPEG.

## Requirements

- Deno v2
- Chromium (or Google Chrome) available in PATH on your machine

## Quick usage

```sh
deno task run <input.gpx> [output.jpg]
```

The output filename is optional — if omitted, a JPEG will be auto-generated next to the input file using the input name with a ".jpg" extension.

The script starts a small local HTTP server, launches headless Chromium to render the GPX HTML, captures a screenshot and writes a JPEG.

Options (when calling gpxToJpg programmatically):
- width, height — page size (defaults: 1920x1200)
- deviceScaleFactor — DPR multiplier (default: 2)
- delay — fixed wait before screenshot is taken (milliseconds)

## Sample

Runs the converter against the bundled test GPX file.

Run the sample task:

```sh
deno task sample
```

## Tests

Run tests locally:

```sh
deno task test
```

## Container

### From GitHub Container Registry

```sh
podman pull ghcr.io/iamasc8277/zz-gpx-to-jpeg:latest
podman run --rm -v "$PWD":/app:Z ghcr.io/iamasc8277/zz-gpx-to-jpeg:latest sample/sample.gpx
```

### Build locally

```sh
podman build -t gpx-to-jpg:latest .
podman run --rm -v "$PWD":/app:Z gpx-to-jpg:latest sample/sample.gpx
```

## License

[MIT License](./LICENSE)
