
import express from 'express';
import bcrypt from 'bcryptjs';
var router = express.Router();
// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getDatabase, ref, set,get,child } from  "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBnvrnYjQOfkeZamAwBvPXJ-OuXMU7ofk4",
  authDomain: "among-us-50faa.firebaseapp.com",
  databaseURL: "https://among-us-50faa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "among-us-50faa",
  storageBucket: "among-us-50faa.appspot.com",
  messagingSenderId: "286208260186",
  appId: "1:286208260186:web:7770adefe6074e21b7c063",
  measurementId: "G-3QSXXNYKBQ"
};
// Initialize Firebase
 initializeApp(firebaseConfig);
 const db = getDatabase();

/* GET home page. */
router.post('/register', function (req, res, next) {
 
 var user = req.body;
 console.log(user)
 user.password = bcrypt.hashSync(user.password, 10);
 set(ref(db, 'users/' + user.username), {
    username: user.username,
    password: user.password
  });

 return res.status(200).send()
});
 router.post('/login', function (req, res, next) {
 
    var user = req.body;
    console.log(user)
    user.password = bcrypt.hashSync(user.password, 10);
    const dbRef = ref(db);
get(child(dbRef, 'users/'+user.username)).then((snapshot) => {
  if (snapshot.exists()) {
    console.log(snapshot.val());
  } else {
    console.log("No data available");
    return res.status(401).send()
  }
}).catch((error) => {
  console.error(error);
});
   
   return  res.status(200).send()
   });
export default router