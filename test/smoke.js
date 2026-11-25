import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const browsers = {
    chrome: { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] },
    firefox: { executablePath: process.env.FIREFOX_PATH },
};

const spanish = {
    chrome: { env: { ...process.env, LANG: 'es_ES.UTF-8' } },
    firefox: {
        env: { ...process.env, LANG: 'es_ES.UTF-8' },
        extraPrefsFirefox: {
            'intl.regional_prefs.use_os_locales': true,
            'intl.accept_languages': 'es-ES, es',
        },
    },
};

const formatDate = () => new Date(2026, 10, 25).toLocaleDateString();

for (const [name, options] of Object.entries(browsers)) {
    {
        await using browser = await puppeteer.launch({ browser: name, ...options });
        const page = await browser.newPage();
        await page.setContent('<h1>ok</h1>');
        assert.equal(await page.$eval('h1', (h1) => h1.textContent), 'ok', name);
        assert.equal(await page.evaluate(formatDate), '11/25/2026', `${name} default locale`);
        console.log(`${name}: ${await browser.version()}`);
    }

    {
        await using browser = await puppeteer.launch({ browser: name, ...options, ...spanish[name] });
        const page = await browser.newPage();
        assert.equal(await page.evaluate(formatDate), '25/11/2026', `${name} es locale`);
        console.log(`${name}: es locale ok`);
    }
}
