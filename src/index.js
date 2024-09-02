const express = require('express');
const qr = require('qrcode');
const PDFDocument = require('pdfkit');
const uuid = require('uuid');
const db = require('./config')

const app = express();
app.use(express.json());
const pdfPath = 'QR Codes.pdf';


const firestore = require('firebase/firestore') ;
const fs = require('fs');
const functions = require('firebase-functions');



// Generate QR codes
app.post('/generate-qrcodes/:n', async (req, res) => {
  const n = parseInt(req.params.n);
  const businessId = req.body.businessId;
  if (isNaN(n) || n <= 0) {
    return res.status(400).json({ error: 'Invalid number of QR codes' });
  }

  const doc = new PDFDocument();
  const chunks = []; // Array to store the PDF chunks
  const qrCodeIds = []; // Array to store the IDs of the generated QR codes

  try {
    const postsCollectionRef = firestore.collection(db, 'posts');
    const qrRecordsCollectionRef = firestore.collection(db, 'qr_records');
    const qrRecordsSnapshot = await firestore.getDocs(firestore.query(qrRecordsCollectionRef, firestore.where('businessId', '==', businessId)));
    let sr_no = 1;
    if (qrRecordsSnapshot.docs.length > 0) {
      const qrRecordsDoc = qrRecordsSnapshot.docs[0];
      const qrRecordsDocRef = qrRecordsDoc.ref;
      if (qrRecordsDoc.exists) {
        sr_no = qrRecordsDoc.data().numPosts + 1;
        await firestore.updateDoc(qrRecordsDocRef, { numPosts: firestore.increment(n) }, firestore.where('businessId', '==', businessId));
      }
    } else {
      await firestore.addDoc(qrRecordsCollectionRef, { businessId: businessId, numPosts: n });
    }

    for (let i = 0; i < n; i++) {
      const id = uuid.v4();
      qrCodeIds.push(id); // Store the ID of the generated QR code
      const url = `https://app.thesecurely.com/documentRetrieve\?qrValue=${id}`;
      console.log(`Generating QR code for URL: ${url}`); // Log URL for debugging
      await generateQRCode(url, doc);
      if (i !== n - 1) {
        doc.addPage();
      }

      // Add the QR code to the post collection
      await firestore.addDoc(postsCollectionRef, { businessId: businessId, QR_code: id, sr_no: sr_no });
      sr_no++;
    }

    doc.on('data', (chunk) => chunks.push(chunk)); // Store each PDF chunk
    doc.on('end', () => {
      const pdfData = Buffer.concat(chunks); // Concatenate all PDF chunks
      const pdfBase64 = pdfData.toString('base64'); // Encode PDF in base64
      const pdfPath = 'QR Codes.pdf'; // Specify the path to save the PDF file
      fs.writeFileSync(pdfPath, pdfData);
      const responseBody = { QRpdf: pdfBase64, qrCodeIds };
      res.setHeader('Content-Type', 'application/json');
      res.send(responseBody);
    });
    doc.end(); // Finalize the PDF document
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate a single QR code
function generateQRCode(url, doc) {
  return new Promise((resolve, reject) => {
    qr.toDataURL(url, { errorCorrectionLevel: 'H' }, (err, qrCodeData) => {
      if (err) {
        console.error('Error generating QR code for:', url, err);
        reject(err);
      } else {
        console.log(`QR code generated for URL: ${url}`); // Log success for debugging
        const qrCodeSize = 250;
        const logoSize = 50;
        const qrCodeX = (doc.page.width - qrCodeSize) / 2;
        const qrCodeY = (doc.page.height - qrCodeSize - logoSize) / 2;
        doc.image(qrCodeData, qrCodeX, qrCodeY, { fit: [qrCodeSize, qrCodeSize] });
        const logoX = qrCodeX + (qrCodeSize - logoSize) / 2;
        const logoY = qrCodeY + (qrCodeSize - logoSize) / 2;
        doc.image('Securely_Logo_(1).png', logoX, logoY, { fit: [logoSize, logoSize] });
        const textX = qrCodeX + 40;
        const textY = qrCodeY + qrCodeSize - 5;
        doc.font('Helvetica-Bold').fontSize(27).text('Scan to Verify', textX, textY);
        resolve();
      }
    });
  });
}

app.post('/single-qrcode', async (req, res) => {
  const businessId = req.body.businessId;
  const id = uuid.v4();
  const url = `https://app.thesecurely.com/documentRetrieve\?qrValue=${id}`;
  const doc = new PDFDocument();
  try {
    await generateQRCode(url, doc);
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="QR Code.pdf"');
      res.send(pdfData);
    });
    doc.end();
    const collectionRef = firestore.collection(db,'posts')
    const qrCollectionRef = firestore.collection(db,'qr_records')
    const qrRecordsSnapshot = await firestore.getDocs(firestore.query(qrCollectionRef,firestore.where('businessId','==',businessId)));
    if(qrRecordsSnapshot.docs.length > 0){
    const qrRecordsDoc = qrRecordsSnapshot.docs[0];
    
    const qrRecordsDocRef = qrRecordsDoc.ref;
    await firestore.addDoc(collectionRef,{businessId: businessId, QR_code:id});
    if(qrRecordsDoc.exists){
      await firestore.updateDoc(qrRecordsDocRef, {numPosts: firestore.increment(1)},firestore.where('businessId','==',businessId));
    }
  }
    else{
      await firestore.addDoc(qrCollectionRef,{businessId: businessId, numPosts: 1});
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
})


app.listen(5000, () => {
  
  console.log('Server running on port 6000');
});

exports.api = functions.runWith({timeoutSeconds: 540}).https.onRequest(app);
