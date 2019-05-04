const functions = require('firebase-functions');
const admin = require("firebase-admin");
const core = require("firebase/app");
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


tripApp.get('/', (req,res)=>{
    let tripRef = db.collection('trip');
    let query = tripRef.get()
        .then(snapshot=>{
            if(snapshot.empty){
                console.log("No matching docs");
                return res.status(404).json({
                    message: 'Not Found',
                    data: []
                });
            }
            let retSet = [];
            snapshot.forEach(doc=>{
                let t = doc.data();
                t.id = doc.id;
                retSet.push(t);
            })
            return res.status(200).json({
                message: "Trip collection retrieved",
                data: retSet,
            })
        }).catch(err=>{console.log(err)});
})


tripApp.post('/', (req, res) =>{
    let tripObj = JSON.parse(req.body.data)
    let newTrip = {
        startDate: tripObj.startDate || "",
        duration: tripObj.duration || "",
        owner: tripObj.owner || "",
        shared: tripObj.shared || [],
        routes: tripObj.routes || [],
        city: tripObj.city || null,
        description: tripObj.description || "",
        name: tripObj.name || "",  
    };


    genId().then(ts => {
        newTrip.id = ts;
        db.collection('trip').doc(ts).set(newTrip);
        let userRef = db.collection('user').doc(newTrip.owner);
        console.log(newTrip.owner)
        userRef.get().then(function(doc) {
            console.log("doc is ", doc.exists)
            if(doc.exists){
                console.log("user exist!")
                userRef.update( {trip: [...doc.data().trip, ts] })
            }
        })
       
        return res.status(201).json({
            message: 'Trip added',
            data: newTrip,
            id: ts,
        })
    }).catch(err=>{
        console.log(err);
    })
    
})


tripApp.get('/:id', (req,res)=>{
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


tripApp.put('/:id', (req,res)=>{
    let refTrip = db.collection('trip').doc(req.params.id);
    let getDoc = refTrip.get()
    .then(doc=>{
        if (!doc.exists){
            return res.status(404).json({
                message: 'Trip not found',
                data: [],
            })
        } else {
            let updatedTrip = JSON.parse(req.body.data)
            let updateTrip = refTrip.update(updatedTrip);
            return res.status(200).json({
                message: 'Trip updated',
                data: updateTrip,
            })
        }
    })
});


tripApp.delete('/:id', (req,res)=>{
    let refTrip = db.collection('trip').doc(req.params.id);

    let delDoc = refTrip.delete();
    return res.status(200).json({
        message: 'Deleted',
        data: []
    });
})

tripApp.get('/shared/:id', (req, res) => {
    let userId = req.params.id;
    db.collection("trip")
        .get()
        .then(function(querySnapshot) {
            let trips = []
            querySnapshot.forEach(function(doc) {
                trip = doc.data();
                if(trip.shared.includes(userId)){
                    trips.push(trip)
                }
            });
            return res.status(200).json({
                message: "Successfully get shared",
                data: trips
            })
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });
})


//UserApp


userApp.post('/', (req, res) =>{
    let nt = req.body.trip? JSON.parse(req.body.trip) : [];
    let newUser = {
        uid: req.body.uid || "",
        email: req.body.email || "",
        name: req.body.name || "",
        trip: nt,
    }
    genId().then(ts =>{
        db.collection('user').doc(newUser.email).set(newUser);
        return ts;
    }).then((ts1)=>{
        if(newUser.trip && newUser.trip.length > 0){

            newUser.trip.forEach((t)=>{
                let refTrip = db.collection('trip').doc(t.toString());
                refTrip.get().then(doc=>{
                    let shared1 = doc.data().shared;
                    if(shared1.indexOf(ts1) === -1){
                        shared1.push(ts1);
                    }
                    refTrip.update({
                        shared: shared1,
                    });
                    return null;
                }).catch(err=>console.log(err));
            });
        }
        return ts1;
    }).then((ts2)=>{
        console.log("User added with id ", ts2);
        return res.status(201).json({
            message: 'User added',
            data: newUser,
            id: ts2,
        });
    }).catch(err=>console.log(err));
})



userApp.get('/:id', (req, res)=>{
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

userApp.get('/gettrip/:id', (req,res)=>{
    let refUser = db.collection('user').doc(req.params.id);
    let retData= [];
    refUser.get().then(doc=>{
        if (!doc.exists){
            return res.status(404).json({
                message: 'User not found',
                data: [],
            })
        }
        return doc.data().trip;
    }).then((trips)=>{
        let results = [];
        trips.forEach(t=>{
            let refTrip = db.collection('trip').doc(t.toString());
            results.push(refTrip.get());
            // refTrip.get().then(doc1=>{
            //     if(!doc1.exists) return null;
            //     retData.push(doc1.data());
            //     results.push(doc1.data());
            //     console.log(retData);
            //     return null;
            // }).catch(err=>console.log(err));
        })
        return Promise.all(results);
    }).then(results=>{
        let reData = []
        for(let r of results){
            if(r.exists) {
                console.log(r.data());
                reData.push(r.data());
            }
        }
        return reData;
    }).then((reData)=>{
        return res.status(200).json({
            message: 'Get trips by user',
            data: reData,
        })
    }).catch(err=>console.log(err));
})

userApp.put('/:id', (req,res)=>{
    let refUser = db.collection('user').doc(req.params.id);
    let userId = req.params.id;
    let getDoc = refUser.get()
    .then(doc=>{
        if (!doc.exists){
            return res.status(404).json({
                message: 'User not found',
                data: [],
            })
        } else {
            let prevTrip = doc.data().trip;
            let newTrip = req.body.trip? JSON.parse(req.body.trip):[];
            let newUserProfile = req.body;
            if(newUserProfile.trip) newUserProfile.trip = JSON.parse(newUserProfile.trip);

            console.log(prevTrip);
            console.log(newTrip);

            let tripToDel = [];
            let tripToAdd = [];
            if(newTrip) {
                tripToDel = prevTrip.filter(x => !newTrip.includes(x));
                tripToAdd = newTrip.filter(x => !prevTrip.includes(x));
            }

            console.log(tripToDel);
            console.log(tripToAdd);


            refUser.update(newUserProfile).then(()=>{
                tripToDel.forEach((t)=>{
                    let refTrip = db.collection('trip').doc(t.toString());
                    refTrip.get().then(doc1=>{
                        if(!doc1.exists) return null;
                        let shared = doc1.data().shared;
                        let idx = shared.indexOf(userId);
                        if(idx!==-1) shared.splice(idx, 1);
        
                        let owner = doc1.data().owner;
                        if(Number(owner) === Number(userId)) owner = 'undefined';
                        
                        refTrip.update({
                            shared: shared,
                            owner: owner,
                        });
                        return null;
                    }).catch(err=>console.log(err));
                });
                return null;
            })
            .then(()=>{
                tripToAdd.forEach((t)=>{
                    let refTrip = db.collection('trip').doc(t.toString());
                    refTrip.get().then(doc1=>{
                        if(!doc1.exists) return null;
                        let shared = doc1.data().shared;
                        let idx = shared.indexOf(userId);
                        if(idx===-1) shared.push(userId);
                        refTrip.update({
                            shared: shared,
                        });
                        return null;
                    }).catch(err=>console.log(err));
                });
                return null;
            })
            .then(()=>{
                return res.status(400).json({
                    message: 'User Updated',
                    data: [],
                })
            })
            .catch(err=>console.log(err));
            return null;
        }
    }).catch(err=>console.log(err));
})


userApp.delete('/:id', (req,res)=>{
    let refUser = db.collection('user').doc(req.params.id);
    let userId = req.params.id;
    refUser.get().then(doc=>{
        if(!doc.exists){
            return res.status(404).json({
                message: 'User not found',
                data: [],
            });
        }
        let tripToDel = doc.data().trip;
        console.log('TripToDel');
        console.log(tripToDel);
        console.log(typeof tripToDel);
        return tripToDel;
    })
    .then((tripToDel)=>{
        console.log(tripToDel);
        tripToDel.forEach((t)=>{
            let refTrip = db.collection('trip').doc(t.toString());
            refTrip.get().then(doc1=>{
                if(!doc1.exists) return null;
                let shared = doc1.data().shared;
                let idx = shared.indexOf(userId);
                if(idx!==-1) shared.splice(idx, 1);

                let owner = doc1.data().owner;
                if(Number(owner) === Number(userId)) owner = 'undefined';
                
                refTrip.update({
                    shared: shared,
                    owner: owner,
                });
                return null;
            }).catch(err=>console.log(err));
        });
        return null;
    }).then(()=>{
        refUser.delete();
        return res.status(200).json({
            message: 'Deleted',
            data: []
        })
    }).catch(err=>console.log(err));

})

userApp.get("/", (req, res) => {
    db.collection("user")
    .get()
    .then(function(querySnapshot) {
        let users = []
        querySnapshot.forEach(function(doc) {
            user = doc.data();
            console.log(user.name)
            users.push({
                name: user.name,
                email: user.email
            })
        });
        return res.status(200).json({
            message: "Successfully get",
            data: users
        })
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });
})



//Export functions
exports.trip = functions.https.onRequest(tripApp);
exports.user = functions.https.onRequest(userApp);