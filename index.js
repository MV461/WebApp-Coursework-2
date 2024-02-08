const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
  origin: 'http://localhost:3000' // Restrict calls to those this address
}));


const uri = "mongodb+srv://mv461:uZDFRgnuQ297HPPi@myfirstcluster.5zcjeqz.mongodb.net/";
const client = new MongoClient(uri);

client.connect()
  .then(() => {
    console.log("Connected to MongoDB!")
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB or performing operation", err);
  })


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

app.get("/lessons", (request, response) => {
  const db = client.db('webapp-cw2');
  const collection = db.collection('lessons');

  collection.find({}).toArray()
    .then((documents) => {
      response.json(documents)
    })
    .catch((err) => {
      response.status.send(err);
    })
})

// Set up a listener for your server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;