FROM node:24-trixie-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        firefox-esr \
        fonts-liberation \
        fonts-noto-color-emoji \
        tini \
    && rm -rf /var/lib/apt/lists/*

ARG PUPPETEER_VERSION=25.18.1

RUN npm install -g puppeteer-core@${PUPPETEER_VERSION} \
    && npm cache clean --force \
    && ln -s /usr/local/lib/node_modules /node_modules \
    && install -d -o node -g node /output

ENV CHROME_PATH=/usr/bin/chromium \
    FIREFOX_PATH=/usr/bin/firefox-esr \
    HOME=/tmp

USER node
WORKDIR /output

ENTRYPOINT ["tini", "--"]
CMD ["sleep", "infinity"]
