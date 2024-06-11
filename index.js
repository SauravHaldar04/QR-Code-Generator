const express = require('express');
const qr = require('qrcode');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const uuid = require('uuid');

const app = express();
const qrCodesDirectory = 'QR codes';
const pdfPath = 'QR Codes.pdf';

// Generate QR codes
app.get('/generate-qrcodes/:n', async (req, res) => {
    const n = parseInt(req.params.n);
    if (isNaN(n) || n <= 0) {
        return res.status(400).json({ error: 'Invalid number of QR codes' });
    }

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));
    try {
        for (let i = 0; i < n; i++) {
            const id = uuid.v4();
            const url = `https://www.thesecurely.com/qrcode/${id}`;
            const qrCodePath = `${qrCodesDirectory}/${id}.png`;

            await generateQRCode(qrCodePath, url, doc);

            if (i !== n - 1) {
                doc.addPage();
            } else {
                doc.end();
                deleteQRCodeImages();
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="QR Codes.pdf"');
                return res.download(pdfPath, 'QR Codes.pdf', (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    console.log('QR codes generated successfully');
                });
            }
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate a single QR code
function generateQRCode(qrCodePath, url, doc) {
    return new Promise((resolve, reject) => {
        qr.toFile(qrCodePath, url, (err) => {
            if (err) {
                console.log('Error occurred');
                reject(err);
            } else {
                console.log(`QR code generated: ${qrCodePath}`);
                doc.image(qrCodePath, {
                    fit: [250, 250],
                    align: 'center',
                    valign: 'center'
                });
                resolve();
            }
        });
    });
}

// Delete QR code images
function deleteQRCodeImages() {
    fs.readdir(qrCodesDirectory, (err, files) => {
        if (err) {
            console.log('Error occurred while reading QR codes directory');
            return;
        }

        files.forEach(file => {
            fs.unlink(`${qrCodesDirectory}/${file}`, err => {
                if (err) {
                    console.log(`Error occurred while deleting ${file}`);
                } else {
                    console.log(`Deleted ${file}`);
                }
            });
        });
    });
}

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
