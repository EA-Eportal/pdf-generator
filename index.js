const express = require('express');
const puppeteer = require('puppeteer');
const app = express()
const port = 3000;
const host = '0.0.0.0';
 
let finalPdf = async (link, name, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
 
    try {
        await page.goto(link, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf();
        const pdfBase64 = pdfBuffer.toString('base64');
        console.log("PDF Base64:", pdfBase64);
        res.send(pdfBase64);
    } catch (err) {
        console.error('Error generating PDF:', err);
        throw err;
    } finally {
        await browser.close();
    }
}
 
app.get('/generatePDF', async (req, res) => {
    if (req.headers.auth_token == 'EAI-PDF-Generate') {
        let url = decodeURIComponent(req.query.link);
        console.log(url, "url");
        try {
            await finalPdf(url, req.query.name, res);
        } catch (error) {
            res.status(500).send('Internal Server Error');
        }
    } else {
        console.log("access denied");
        res.status(401).send("Access Denied");
    }
});
 
app.listen(port, host, () => console.log(`PDF Generator app listening on port ${port}!`));