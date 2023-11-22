import express, { Request, Response } from 'express';
import { chromium } from 'playwright';
import https from 'https';

const app = express();
const port = 3000;
const host = '0.0.0.0';

const generatePDFFromHTML = async (htmlContent: string): Promise<string> => {
  const browser = await chromium.launch({
    headless: true,
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

app.get('/generatePDF', async (req: Request, res: Response) => {
  const authToken = req.headers.auth_token as string;
  if (authToken !== 'EAI-PDF-Generate') {
    return res.status(401).send('Access Denied');
  }

  const url = req.query.link as string;

  try {
    https.get(url, (response) => {
      let htmlData = '';

      response.on('data', (chunk) => {
        htmlData += chunk;
      });

      response.on('end', async () => {
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

app.get('/health', async (req: Request, res: Response) => {
  if (req.headers.auth_token === 'EAI-PDF-Generate') {
    const htmlContent = '<html><body><h1>Hello, PDF!</h1></body></html>';

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
