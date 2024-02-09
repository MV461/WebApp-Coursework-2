const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');

const uri = "mongodb+srv://mv461:uZDFRgnuQ297HPPi@myfirstcluster.5zcjeqz.mongodb.net/";
const client = new MongoClient(uri);

client.connect()
  .then(() => {
    console.log("Connected to MongoDB!")
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB or performing operation", err);
  })

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use((request, response, next) => {
  console.log(`${new Date().toISOString()} - ${request.method} ${request.url}`);
  next();
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

// Route to serve the icon based on the icon name query parameter
app.get('/icon', (request, response) => {

  let iconNames = [];
  const lessonsFilePath = path.join(__dirname, 'public', 'lessons.json'); 

  try {
    const lessonsFileContent = fs.readFileSync(lessonsFilePath, 'utf8');
    const lessonsData = JSON.parse(lessonsFileContent);
    iconNames = lessonsData.map(lesson => lesson.icon);
  } catch (error) {
    console.error('Error reading lessons.json:', error);
  }

  // Extract the icon name from the query parameters
  const { icon } = request.query;

  // Check if the icon is in the iconNames array
  if (iconNames.includes(icon)) {
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Icon Display</title>
        <script src="https://kit.fontawesome.com/d0fcba61dc.js" crossorigin="anonymous"></script>
      </head>
      <body>
        <i class="${icon}"></i>
      </body>
      </html>
    `;
    // Send the icon back to the client
    response.send(htmlResponse);
  } else {
    // Icon was not found in the iconNames array, send a   404 response
    response.status(404).send('Lesson icon not found.');
  }

});

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