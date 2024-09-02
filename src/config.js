const firebase = require("firebase/app");
const {getFirestore} = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCoe776QaJ4jpywcnRH9e1l0LZlP_bdiqk",
    authDomain: "ly-lb9yn6-45bfe.firebaseapp.com",
    projectId: "securely-lb9yn6",
    storageBucket: "securely-lb9yn6.appspot.com",
    messagingSenderId: "915487005472",
    appId: "1:915487005472:web:f8aba24466ebe3bc551545"
};

firebase.initializeApp(firebaseConfig);

const db = getFirestore();

module.exports = db;