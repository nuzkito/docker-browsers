# browsers

A Docker image to test web apps in a real browser with
[Puppeteer](https://pptr.dev/) scripts.

Docker Hub: [`nuzkito/browsers`](https://hub.docker.com/r/nuzkito/browsers)

## Contents

- Chromium (from Debian trixie), with the translations of `chromium-l10n`.
- Firefox ESR (from Debian trixie).
- `puppeteer-core` 25.18.1, installed globally. Scripts can `import` it
  from any directory.
- Node.js 24.
- Fonts: Liberation and Noto Color Emoji.

The images are available for `linux/amd64` and `linux/arm64`.

The image sets these environment variables:

| Variable       | Value                         |
| -------------- | ----------------------------- |
| `CHROME_PATH`  | `/usr/bin/chromium`           |
| `FIREFOX_PATH` | `/usr/bin/firefox-esr`        |
| `HOME`         | `/tmp`                        |

The container runs `sleep infinity`, so it stays up and you can
`docker compose exec` into it. [tini](https://github.com/krallin/tini) is the
entrypoint: it stops the container quickly and removes the zombie processes
that the browsers leave.

The default user is `node` (UID and GID 1000). The working directory is
`/output`: scripts save files there when they use a relative path, such as
`screenshot.png`.

## Browser versions

Debian decides the versions of Chromium and Firefox ESR. Two builds on
different dates can have different browser versions, also with the same
`puppeteer-core` version.

## Use in `compose.yml`

```yaml
services:
  browser:
    image: nuzkito/browsers:1
    network_mode: service:app
    volumes:
      - ./browser-output:/output
```

With `network_mode: service:<app>`, the browser opens the app at the same URLs
as the host (for example, `http://127.0.0.1:8000`). Replace `app` with the name
of your app service.

The volume shows on the host the files that scripts save in `/output`, such as
screenshots and downloads.

Create the host directory before you start the container. Otherwise Docker
creates it with the owner `root`, and the scripts cannot write to it:

```sh
mkdir browser-output
```

If your host user is not 1000:1000, add `user: "<uid>:<gid>"`.

## Launch each browser

Chrome:

```js
const browser = await puppeteer.launch({
    browser: 'chrome',
    executablePath: process.env.CHROME_PATH,
    args: ['--no-sandbox'],
});
```

Firefox:

```js
const browser = await puppeteer.launch({
    browser: 'firefox',
    executablePath: process.env.FIREFOX_PATH,
});
```

To save downloads in the working directory, add this option to
`puppeteer.launch`:

```js
downloadBehavior: { policy: 'allow', downloadPath: process.cwd() },
```

A full example that takes a screenshot of the app:

```js
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
    browser: 'chrome',
    executablePath: process.env.CHROME_PATH,
    args: ['--no-sandbox'],
});

const page = await browser.newPage();
await page.goto('http://127.0.0.1:8000');
await page.screenshot({ path: 'screenshot.png' });
await browser.close();
```

## Change the language

The default language is `en-US`. To use a different language, for example to
show dates and numbers in the Spanish format, set the `LANG` environment
variable:

```yaml
services:
  browser:
    image: nuzkito/browsers:1
    environment:
      LANG: es_ES.UTF-8
```

Chromium reads the language from `LANG` or `LANGUAGE` (for example,
`LANGUAGE=es`). On Linux, Chromium ignores the `--lang` flag.

Firefox also needs these preferences in `puppeteer.launch`:

```js
extraPrefsFirefox: {
    'intl.regional_prefs.use_os_locales': true,
    'intl.accept_languages': 'es-ES, es',
},
```

- `intl.regional_prefs.use_os_locales` makes Firefox take the date and number
  format from `LANG`. `LANGUAGE` has no effect on Firefox.
- `intl.accept_languages` sets `navigator.language` and the `Accept-Language`
  header. It is optional: add it if the app selects its language from these
  values.

The CDP command `Emulation.setLocaleOverride` changes `navigator.language` and
`Intl`, but Chromium still shows `<input type="date">` in the browser
language. Use `LANG` if your screenshots show these inputs.

## Run a script

```sh
docker compose exec --no-tty browser node - < script.js
```

## Tags

Each release publishes these tags. For release `1.2.3`:

- `1.2.3`: this exact release.
- `1.2`: the latest `1.2.x` release.
- `1`: the latest `1.x.x` release.
- `latest`: the latest release.

A release moves a floating tag only if it is the highest release for that tag.
For example, release `1.1.5` after `1.2.0` moves `1.1`, but not `1` or
`latest`.

`latest` moves to new major versions, and they can have breaking changes.

## Development

Build the image and run the smoke test:

```sh
docker build --tag browsers:dev .
docker run --rm --interactive browsers:dev node - < test/smoke.js
```

To change the `puppeteer-core` version, edit `PUPPETEER_VERSION` in the
`Dockerfile`, or use `--build-arg PUPPETEER_VERSION=<version>`. If you edit the
`Dockerfile`, also change the version in the "Contents" section of this README.

To find new `puppeteer-core` versions, run this script (it needs `npm` and
`jq`):

```sh
scripts/check-puppeteer.sh
```

It shows the version in the `Dockerfile`, the newest version of the same
major, and the latest version:

```
Current:     25.18.1
Newest 25.x: 25.18.1
Latest:      25.18.1
```

## Publish a new release

```sh
git tag 1.0.1 && git push origin 1.0.1
```

The GitHub Actions workflow builds the image for amd64 and arm64, each on a
native runner. It pushes each image by digest, without a tag, and runs the
smoke test on it. If both tests pass, the workflow adds the release tags to
the same images.

The workflow needs the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository
secrets.
