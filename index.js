const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const path = require('path');

const uri = "mongodb+srv://mv461:uZDFRgnuQ297HPPi@myfirstcluster.5zcjeqz.mongodb.net/";
const client = new MongoClient(uri);
let db, lessonsCollection, ordersCollection;

client.connect()
  .then(() => {
    console.log("Connected to MongoDB!")

    db = client.db("webapp-cw2")
    // lessonsCollection = db.collection('lessons');
    // ordersCollection = db.collection('orders');


  })
  .catch((err) => {
    console.error("Error connecting to MongoDB or performing operation", err);
  })


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

app.get("/lessons", (request, response) => {
  db.collection('lessons').find({}).toArray()
    .then((documents) => {
      response.json(documents)
    })
    .catch((err) => {
      response.status.send(err);
    })
})

// Set up a listener for your server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
