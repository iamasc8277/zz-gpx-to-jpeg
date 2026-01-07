FROM docker.io/denoland/deno:latest

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates wget chromium \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN deno install

ENTRYPOINT ["/entrypoint.sh"]
