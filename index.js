const express = require('express');
const { chromium } = require('playwright');
const https = require('https');
const app = express();
const port = 3000;
const host = '0.0.0.0';

const generatePDFFromHTML = async (htmlContent) => {
  const browser = await chromium.launch({
    headless: true, // Run Playwright in headless mode
    // Other configurations...
  });
  const page = await browser.newPage();

  try {
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf();
    return pdfBuffer.toString('base64');
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
};

app.get('/generatePDF', async (req, res) => {
    const authToken = req.headers.auth_token;
    if (authToken !== 'EAI-PDF-Generate') {
      return res.status(401).send('Access Denied');
    }
  
    const url = req.query.link;
    // const url = 'https://uat-e-portal.europ-assistance.in/admin/certificate-pdf?car_id=&prdID=0&subscription_id=3739227';
    console.log(url, 'url');
    try {
      https.get(url, (response) => {
        let htmlData = '';
  
        response.on('data', (chunk) => {
          htmlData += chunk;
        });
  
        response.on('end', async () => {
            console.log(htmlData, 'htmlData');
          try {
            const pdfBase64 = await generatePDFFromHTML(htmlData);
            res.send(pdfBase64);
          } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).send('Error generating PDF');
          }
        });
      }).on('error', (error) => {
        console.error('Error fetching HTML:', error);
        res.status(500).send('Error fetching HTML');
      });
    } catch (error) {
      console.error('Internal Server Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
app.get('/health', async (req, res) => {
  if (req.headers.auth_token === 'EAI-PDF-Generate') {
    const htmlContent = '<html><body><h1>Hello, PDF!</h1></body></html>'; // Replace this with your HTML content
    
    try {
      const pdfBase64 = await generatePDFFromHTML(htmlContent);
      res.send(pdfBase64);
    } catch (error) {
      console.error('Internal Server Error:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(401).send('Access Denied');
  }
});

app.listen(port, host, () => {
  console.log(`PDF Generator app listening on port ${port}!`);
});
