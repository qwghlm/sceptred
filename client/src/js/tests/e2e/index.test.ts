const { spawn } = require('child_process');
const path = require('path');
const puppeteer = require('puppeteer');

const hostname = 'localhost';
const port = 8000;

const headless = true;

var slowMo = headless ? 0 : 100;
var args;
// Headless = true in Puppeteer sets webgl to off, so this does the same but enables webgl
if (headless) {
    args = [
        '--headless',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-sandbox',
    ];
}

var browser, page, proc;
var procwd = path.resolve(__dirname, '../../../../../server/');

beforeAll(async () => {

    browser = await puppeteer.launch({headless: false, slowMo, args});
    page = await browser.newPage();

    try {
        await page.goto(`http://${hostname}:${port}`);
    }
    catch (error) {
        if (error.message == 'net::ERR_CONNECTION_REFUSED') {
            console.warn("Firing up server...");
            proc = spawn("fresh", { cwd: procwd });
            await page.waitFor(4000);
        }
        else {
            throw error;
        }
    }

});

afterAll(async () => {
    if (proc) {
        console.warn("Killing server...");
        proc.kill('SIGTERM');
    }
    await browser.close();
});

test("Homepage works", async () => {

    var messages = [];
    page.on("console", (msg) => {
        messages.push(msg.text());
    });

    await page.goto(`http://${hostname}:${port}`);
    await page.waitFor(2000);

    // One console message, from the THREE.js bundle
    expect(messages.length).toBe(1);
    expect(messages[0]).toMatch(/THREE.WebGLRenderer [0-9]+/);

    // One canvas should be created
    const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
    expect(canvases).toBe(1);

}, 30000);
