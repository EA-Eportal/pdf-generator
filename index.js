const express = require('express');
var fs = require('fs')
var conversion = require("phantom-html-to-pdf")();
const app = express()
const port = 3000;
const host = '0.0.0.0';

let finalPdf = (link, name, res) => {
    //Replace {html: ...} to {url : link}
    conversion({ url: link }, function (err, pdfStream) {
        if (err) {
            throw err;
        } else {
            var chunks = [];

            pdfStream.stream.on('data', (chunk) => {
                // Collect PDF data in chunks
                chunks.push(chunk);
            });


            pdfStream.stream.on('end', () => {
                var pdfBuffer = Buffer.concat(chunks);
                var pdfBase64 = pdfBuffer.toString('base64');
                console.log("PDF Base64:", pdfBase64);
                // var decodedData = Buffer.from(pdfBase64, 'base64');
                // var outputFilePath = `${__dirname}/to/${name}.pdf`;
                // fs.writeFile(outputFilePath, decodedData, 'binary', (err) => {
                //     if (err) {
                //         console.error('Error writing PDF file:', err);
                //     } else {
                //         console.log('PDF file saved:', outputFilePath);
                //     }
                // });

                res.send(pdfBase64);
            });
        }
    });
}


app.get('/generatePDF', (req, res) => {
    if (req.headers.auth_token == 'EAI-PDF-Generate') {

        let url = decodeURIComponent(req.query.link);
        console.log(url, "url");
        finalPdf(url, req.query.name, res);

    } else {
        console.log("access denied");
        res.status(401).send("Access Denied");
    }
});



app.listen(port, host, () => console.log(`Example app listening on port ${port}!`));
