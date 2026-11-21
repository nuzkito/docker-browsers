import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const browsers = {
    chrome: { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] },
    firefox: { executablePath: process.env.FIREFOX_PATH },
};

for (const [name, options] of Object.entries(browsers)) {
    await using browser = await puppeteer.launch({ browser: name, ...options });
    const page = await browser.newPage();
    await page.setContent('<h1>ok</h1>');
    assert.equal(await page.$eval('h1', (h1) => h1.textContent), 'ok', name);
    console.log(`${name}: ${await browser.version()}`);
}
