import express, { Request, Response } from 'express';
import { chromium, Browser, Page } from 'playwright';
const ejs = require("ejs");

const app = express();
const port = 3000;
const host = '0.0.0.0';

let browser: Browser;

const generatePDFFromHTML = async (htmlContent: string): Promise<string> => {
  const page: Page = await browser.newPage();

  try {
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf();
    return pdfBuffer.toString('base64');
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  } finally {
    console.log('Closing page...');
    await page.close();
  }
};

// const ejsProceessor = async (ejsContent: string, templateValues: any) =>{
//   const htmlTemplate = await ejs.render(ejsContent.toString(), templateValues);
//   return htmlTemplate;
// }

const valueProceessor = async (htmlContent: string, templateValues: any) =>{
  const variables = Object.keys(templateValues);
  for (const variable of variables) {
    const data = templateValues[variable];
    const regex = new RegExp(`{{${variable}}}`, 'g');
    htmlContent = htmlContent.replace(regex, data);
  }
  console.log("new content", htmlContent);

  return htmlContent;
 
}

app.get('/generatePDF', async (req: Request, res: Response) => {
  const authToken = req.headers.auth_token as string;
  if (authToken !== 'EAI-PDF-Generate') {
    return res.status(401).send('Access Denied');
  }

  const url = req.query.link as string;
  const dynamicDataObj = req.query.data  ? req.query.data : null;

  try {
    const page = await browser.newPage();
    await page.goto(url,  { waitUntil: 'networkidle' });

    const htmlContent = await page.content();

    console.log("dynamic Value", dynamicDataObj);

    const finalHtmlContent = dynamicDataObj ? await valueProceessor(htmlContent, dynamicDataObj): htmlContent;
    const pdfBase64 = await generatePDFFromHTML(finalHtmlContent);

    res.send(pdfBase64);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
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

// Launch the browser when the server starts
(async () => {
  browser = await chromium.launch({
    headless: true,
  });

  app.listen(port, host, () => {
    console.log(`PDF Generator app listening on port ${port}!`);
  });
})();
