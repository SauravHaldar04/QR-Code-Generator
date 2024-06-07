const qr = require('qrcode');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const uuid = require('uuid');

const qrCodesDirectory = 'QR codes';
const pdfPath = 'QR Codes.pdf';

// Generate QR codes
async function generateQRCodes(n) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));

    for (let i = 0; i < n; i++) {
        const id = uuid.v4();
        const url = `https://thesecurely.com/qrcode/${id}`;
        const qrCodePath = `${qrCodesDirectory}/${id}.png`;

        await generateQRCode(qrCodePath, url, doc);

        if (i !== n - 1) {
            doc.addPage();
        } else {
            doc.end();
            deleteQRCodeImages();
        }
    }
}

// Generate a single QR code
function generateQRCode(qrCodePath, url, doc) {
    return new Promise((resolve, reject) => {
        qr.toFile(qrCodePath, url, (err, src) => {
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

generateQRCodes(1000);
