const functions = require('firebase-functions');
const admin = require("firebase-admin");
const express = require('express');
const cors = require('cors');
const tripApp = express();
const userApp = express();
// Automatically allow cross-origin requests
tripApp.use(cors({ origin: true }));
userApp.use(cors({ origin: true }));

// Admin initialization
admin.initializeApp(functions.config().firebase);

// Link DB
var db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions


const genId = async () =>{
    let date = new Date();
    let ts = date.getTime();
    ts = ts.toString();
    return ts;
}
tripApp.post('/', (req, res) =>{
    let newTrip = {
        startdate: req.body.startdate || "",
        duration: req.body.duration || "",
        owner: req.body.owner || "",
        shared: req.body.shared || [],
        routes: req.body.routes || [],
    };


    genId().then(ts =>{
        db.collection('trip').doc(ts).set(newTrip);

        return res.status(201).json({
            message: 'Trip added',
            data: newTrip,
            tripid: ts,
        })
    }).catch(err=>{
        console.log(err);
    })
    
})


tripApp.get('/id/:id', (req,res)=>{
    let retTrip = db.collection('trip').doc(req.params.id);
    let getDoc = retTrip.get()
        .then(doc=>{
            if (!doc.exists){
                return res.status(404).json({
                    message: 'Trip not found',
                    data: [],
                })
            } else {
                return res.status(200).json({
                    message: 'Trip retrieved',
                    data: doc.data(),
                });

            }
        })
})


tripApp.put('/id/:id', (req,res)=>{
    let refTrip = db.collection('trip').doc(req.params.id);
    let getDoc = refTrip.get()
    .then(doc=>{
        if (!doc.exists){
            return res.status(404).json({
                message: 'Trip not found',
                data: [],
            })
        } else {
            let updateTrip = refTrip.update(req.body);
            return res.status(200).json({
                message: 'Trip updated',
                data: updateTrip,
            })
        }
    })
});


//UserApp

userApp.post('/', (req, res) =>{
    let newUser = {
        uid: req.body.uid || "",
        email: req.body.email || "",
        name: req.body.name || "",
    }
    genId().then(ts =>{
        db.collection('user').doc(ts).set(newUser);
        return res.status(201).json({
            message: 'User added',
            data: newUser,
            userid: ts,
        })
    }).catch(err=>{
        console.log(err);
    })
    
})



userApp.get('/id/:id', (req, res)=>{
    let refUser = db.collection('user').doc(req.params.id);
    let getDoc = refUser.get()
    .then(doc=>{
        if (!doc.exists){
            return res.status(404).json({
                message: 'User not found',
                data: [],
            })
        } else {
            return res.status(200).json({
                message: 'User retrieved',
                data: doc.data(),
            });
        }
    }).catch(err=>{
        console.log(err);
        return res.status(500).send({message: 'Server error', data: err});
    });
});



userApp.put('/id/:id', (req,res)=>{
    let refUser = db.collection('user').doc(req.params.id);
    let getDoc = refUser.get()
    .then(doc=>{
        if (!doc.exists){
            return res.status(404).json({
                message: 'User not found',
                data: [],
            })
        } else {
            let updateUser = refUser.update(req.body);
            return res.status(200).json({
                message: 'User updated',
                data: updateUser,
            })
        }
    })
})
//Export functions
exports.trip = functions.https.onRequest(tripApp);
exports.user = functions.https.onRequest(userApp);