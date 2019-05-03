const functions = require('firebase-functions');
const admin = require("firebase-admin");
const express = require('express');
const cors = require('cors');
const app = express();
const app1 = express();
// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// Admin initialization
admin.initializeApp(functions.config().firebase);

// Link DB
var db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions



app.post('/', (req, res) =>{
    let newTrip = {
        startDate: req.body.startdate || "",
        duration: req.body.duration || "",
        owner: req.body.owner || "",
        shared: req.body.shared || [],
        routes: req.body.routes || [],
    }
    let refId = "";
    var setTrip = db.collection('trip').add(newTrip).then(ref=>{
        console.log('Added document with ID: ', ref.id);
        refId = ref.id;
        return ref;
    }).catch(err=>{
        return res.status(500).send({message: 'Server error', data: err});
    })
    
    return res.status(201).json({
        message: 'Trip added',
        id: refId,
        data: newTrip,
    })
})


app.get('/id/:id', (req,res)=>{
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
                    id: doc.id(),
                });
            }
        }).catch(err=>{
            return res.status(500).send({message: 'Server error', data: err});
        });
})

app.put('/id/:id', (req,res)=>{
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
                data: [],
            })
        }
    }).catch(err=>{
        return res.status(500).send({message: 'Server error', data: err});
    });
});


app1.get('/id/:id', (req, res)=>{
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
                id: doc.id(),
            });
        }
    }).catch(err=>{
        return res.status(500).send({message: 'Server error', data: err});
    });
});

app1.put('/id/:id', (req,res)=>{
    let refUser = db.collection('user').doc(req.params.id);
    let getDoc = refUser.get()
    .then(doc=>{
        if (!doc.exists){
            return res.status(404).json({
                message: 'User not found',
                data: [],
            })
        } else {
            let updateTrip = refTrip.update(req.body);
            return res.status(200).json({
                message: 'User updated',
                data: [],
            })
        }
    }).catch(err=>{
        return res.status(500).send({message: 'Server error', data: err});
    });
})
//Export functions
exports.trip = functions.https.onRequest(app);
exports.user = functions.https.onRequest(app1);