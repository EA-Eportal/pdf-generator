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

const changesAsPerConfig = (htmlContent: string, clientConfig: any) => {
  const isMRPOnCertificate = clientConfig.filter((client: any) => client.name === "MRP_ON_CERTIFICATE");
  const isClientLogoOnCertificate = clientConfig.filter((client: any) => client.name === "CLIENT_LOGO_ON_CERTIFICATE");
  const isClientCertificateTC = clientConfig.filter((client: any) => client.name === "CERTIFICATE_TC");
  const isClientIntro = clientConfig.filter((client: any) => client.name === "CERTIFICATE_INTRODUCTION");
  const isQRInCertificate = clientConfig.filter((client: any) => client.name === "QR_CODE_ON_CERTIFICATE");
  const isHSNCodeAvailable = clientConfig.filter((client: any) => client.name === "HSN_CODE_ON_INVOIC");
  //isMRP
  if (isMRPOnCertificate.length === 0) {
    htmlContent = htmlContent.replace(`<th>MRP</th>`, "").replace("<td>Rs. {{MRP}}/-</td>", "");
  }
  //isClientLogo
  if (isClientLogoOnCertificate.length === 0) {
    htmlContent = htmlContent.replace(`<img src="https://ik.imagekit.io/gqj3d4vec/images/rectangle_419.png?updatedAt=1700817803223" alt="Right Image">`, "");
  }
  //isClientCertificateTC
  if (isClientCertificateTC.length) {
    htmlContent = htmlContent.replace(`{{REPLACE_TC}}`, isClientCertificateTC[0].key)
  } else {
    htmlContent = htmlContent.replace(`{{REPLACE_TC}}`, "")
  }
  if (isClientIntro.length) {
    htmlContent = htmlContent.replace(`{{INTRO}}`, isClientIntro[0].key)
  } else {
    htmlContent = htmlContent.replace(`{{INTRO}}`, "")
  }
  if (isQRInCertificate.length) {
    htmlContent = !isQRInCertificate[0].is_active ? htmlContent.replace(`<p>Scan this QR Code for RSA Breakdown Assistance</p><!-- Add your QR Code image here --><img src="https://ik.imagekit.io/gqj3d4vec/images/RSA_QR.png?updatedAt=1700817804551" alt="QR Code" class="img-fluid" style="width: 150px; height: 150px;">`, "") : htmlContent;
  }

  if (isHSNCodeAvailable.length === 0) {
    htmlContent = htmlContent.replace(` <th>HSN Code</th>`, "").replace("<td>{{HSN_CODE}}</td>", "")
  }

  return htmlContent
}

app.get('/generatePDF', async (req: Request, res: Response) => {
  const authToken = req.headers.auth_token as string;
  if (authToken !== 'EAI-PDF-Generate') {
    return res.status(401).send('Access Denied');
  }

  const url = req.query.link as string;
  const dynamicDataObj = req.query.data ? req.query.data : null;
  const clientConfig = req.query.clientConfig ? req.query.clientConfig : null;
  console.log(clientConfig, "client config")

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    let htmlContent = await page.content();

    console.log("dynamic Value", dynamicDataObj);
    // htmlContent = clientConfig ? changesAsPerConfig(htmlContent, clientConfig) : htmlContent;
    const finalHtmlContent = dynamicDataObj ? await valueProceessor(htmlContent, dynamicDataObj) : htmlContent;
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
