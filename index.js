const express = require('express');
const puppeteer = require('puppeteer');
const app = express()
const port = 3000;
const host = '0.0.0.0';

let finalPdf = async (link, name, res) => {
    const browser = await puppeteer.launch({
        headless: 'new', // Opt-in to the new headless mode
        // Other configurations...
    });
    const page = await browser.newPage();
    console.log('in final pdf----');
    try {
        console.log('in try----');
        await page.goto(link, { waitUntil: 'networkidle0' });
        console.log('page----');
        const pdfBuffer = await page.pdf();
        console.log(pdfBuffer, 'pdfBuffer----');
        const pdfBase64 = pdfBuffer.toString('base64');
        console.log(pdfBase64, 'pdfBase64----');
        console.log("PDF Base64:", pdfBase64);
        console.log(pdfBase64, 'pdfBase64----');
        res.send(pdfBase64);
    } catch (err) {
        console.error('Error generating PDF:', err);
        throw err;
    } finally {
        console.error('final:');
        await browser.close();
    }
}

app.get('/generatePDF', async (req, res) => {
    if (req.headers.auth_token == 'EAI-PDF-Generate') {
        req.query.link = 'https://uat-e-portal.europ-assistance.in/admin/certificate-pdf?car_id=&prdID=0&subscription_id=3739227';
        let url = decodeURIComponent(req.query.link);
        console.log(url, "url");
        try {
            console.log(url, "in try");
            const generate_res = await finalPdf(url, req.query.name, res);
            console.log('generate res', generate_res);
        } catch (error) {
            console.log('error', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        console.log("access denied");
        res.status(401).send("Access Denied");
    }
});

app.listen(port, host, () => console.log(`PDF Generator app listening on port ${port}!`));