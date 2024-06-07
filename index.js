const qr = require('qrcode')
const url = 'https://www.google.com'

qr.toFile("qr.png",url, (err, src) => {
    if (err) {
        console.log('error occurred')
        return
    }
});