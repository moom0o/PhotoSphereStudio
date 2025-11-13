// Mostly used Gemini for this since I needed something quick to scrape Google and remove dead urls

import puppeteer from 'puppeteer';
import fs from 'fs';
const targetHost = 'www.google.com/maps/photometa/v1'; // This is what we're hunting
const urlsToProcess = JSON.parse(fs.readFileSync("list.json"))
async function findMetadataRequest(url) {
    console.log(`[PUPPETEER] Launching browser for: ${url}`);
    let browser;
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();

        // This is the magic. We create a "promise" that
        // our event listener can "resolve" when it finds the URL.
        const foundUrlPromise = new Promise((resolve, reject) => {
            // Set up the listener *before* we navigate
            page.on('request', (request) => {
                const requestUrl = request.url();
                // Check if the URL is the one we want
                if (requestUrl.includes(targetHost)) {
                    console.log(`[INTERCEPTED] Found target URL: ${requestUrl}...`);
                    // This is it! Stop listening and return the URL.
                    page.off('request');
                    resolve(requestUrl);
                }
            });

            // Set a 30-second timeout for the whole operation
            setTimeout(() => {
                reject(new Error(`Timeout: Did not find a request to ${targetHost} within 30 seconds.`));
            }, 30000);
        });

        // 1. Go to the page. This will trigger all the JS and network calls.
        console.log(`[PUPPETEER] Navigating and waiting for requests...`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 2. Wait for our promise to be resolved by the event listener.
        const realUrl = await foundUrlPromise;

        await browser.close();
        console.log(`[SUCCESS] Captured metadata URL.`);
        return realUrl;

    } catch (error) {
        console.error(`[ERROR] Failed to capture request:`, error.message);
        if (browser) {
            await browser.close();
        }
        return null;
    }
}
import unirest from 'unirest';

// --- Run the example ---
(async () => {
    processList()
})();

// 3. THE MAIN FUNCTION TO PROCESS THE LIST
async function processList() {
    console.log(`Starting check for ${urlsToProcess.length} URLs...`);
    const aliveUrls = [];
    const deadUrls = [];
    const taoUrls = [];

    for (const item of urlsToProcess) {
        const realUrl = await findMetadataRequest(item.url);
        if (realUrl) {
            console.log(`\nCaptured URL: ${realUrl}`);
            var req = unirest('GET', realUrl)
                .end(function (res) {
                    if (res.error) throw new Error(res.error);
                    // Removing tao's stupid photospheres, constantly spamming the website with stupid pictures
                    if(res.raw_body.includes("Táo TV")){
                        taoUrls.push(item);
                        try {
                            const outputData = JSON.stringify(taoUrls, null, 2); // Pretty-print JSON
                            fs.writeFileSync('tao_photospheres.json', outputData);
                            console.log('Successfully saved results to tao_photospheres.json');
                        } catch (err) {
                            console.error('Error writing to file:', err);
                        }
                        return console.log("fuck ass tao")
                    } else if (res.raw_body.includes("[[],[[[2],")
                    ){
                        deadUrls.push(item);
                        try {
                            const outputData = JSON.stringify(deadUrls, null, 2); // Pretty-print JSON
                            fs.writeFileSync('dead_photospheres.json', outputData);
                            console.log('Successfully saved results to dead_photospheres.json');
                        } catch (err) {
                            console.error('Error writing to file:', err);
                        }
                        return console.log("dead")
                    } else if(res.raw_body.includes("[[],[[[1],")){
                        aliveUrls.push(item);
                        try {
                            const outputData = JSON.stringify(aliveUrls, null, 2); // Pretty-print JSON
                            fs.writeFileSync('alive_photospheres.json', outputData);
                            console.log('Successfully saved results to alive_photospheres.json');
                        } catch (err) {
                            console.error('Error writing to file:', err);
                        }
                        return console.log("good")

                    }
                    //console.log(res.raw_body);
                });

        } else {
            console.log(`\nCould not capture a metadata request from that page.`);
        }
    }
    console.log(`\nProcess complete. Found ${aliveUrls.length} live URLs.`);
}