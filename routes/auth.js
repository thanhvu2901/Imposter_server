
import express from 'express';
import bcrypt from 'bcryptjs';
var router = express.Router();
// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getDatabase, ref, set,get,child } from  "firebase/database";
import { async } from '@firebase/util';
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
 router.post('/login', async function (req, res, next) {
 
    let user = req.body;
    console.log(user)
    const dbRef = ref(db);
    var auth=true;
     const value1= await get(child(dbRef, 'users/'+user.username)).then(async(snapshot) => {
  if (snapshot.exists()) {
   // console.log(snapshot.val());
    const value = snapshot.val();
    console.log(value)
   if (!bcrypt.compareSync(user.password, value.password)) {
      auth=false;
       }
  } else {
    console.log("No data available");
    auth=false;
  }
}).catch((error) => {
  console.error(error);
});
if(auth===true){
   return res.status(200).json({
    authenticated: true,
  });
}
  else{
    return res.status(404).json({
        authenticated: false,
      });
  }
   });
export default router