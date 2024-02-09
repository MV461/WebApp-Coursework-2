const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://mv461:uZDFRgnuQ297HPPi@myfirstcluster.5zcjeqz.mongodb.net/";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

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

  let client;
  MongoClient.connect(uri)
    .then((connectedClient) => {
      client = connectedClient;
      const db = client.db('webapp-cw2');
      const collection = db.collection('lessons');

      // Perform a find operation on the collection
      return collection.find({}).toArray();
    })
    .then((documents) => {

      response.json(documents);
    })
    .catch((err) => {
      console.error(error);
      response.status(500).send('Error occurred while fetching lessons');
    })
    .finally(() => {
      client.close();
    })
})

app.get("/orders", (request, response) => {
  let client;
  MongoClient.connect(uri)
    .then((connectedClient) => {
      client = connectedClient;
      const db = client.db('webapp-cw2');
      const collection = db.collection('orders');

      return collection.find({}).toArray()
    })
    .then((documents) => {
      response.json(documents)
    })
    .catch((err) => {
      response.status.send(err);
    })
    .finally(() => {
      client.close();
    })
})

// Define the POST route for saving new orders
app.post('/orders', (request, response) => {
  // Extract the order data from the request body
  const orderData = request.body;

  // Validate the order data
  if (!orderData.customerData || !orderData.cart || typeof orderData.total !== 'number') {
    return response.status(400).send('Invalid order data.');
  }

  let client;
  MongoClient.connect(uri)
    .then((connectedClient) => {
      client = connectedClient;

      // Get a reference to the 'orders' collection
      const db = client.db('webapp-cw2');
      const collection = db.collection('orders');

      // Insert the new order into the 'orders' collection
      return collection.insertOne(orderData)
    })
    .then((result) => {
      // Send a success response with the ID of the newly inserted document
      response.status(201).json({ message: 'Order saved successfully.', id: result.insertedId });
    })
    .catch(error => {
      // Handle any errors that occur during the insertion
      console.error('Error inserting order:', error);

      if (error.code = 11000) {
        response.status(409).send('Duplicate order detected. Failed to insert order.');
      } else {
        response.status(500).send('An error occurred while saving the order.');

      }
    })
    .finally(() => {
      client.close();
    })
});

app.put('/updateLesson', (request, response) => {
  // Extract the necessary data from the request body
  const lessonUpdateData = request.body;

  // Validate the lesson update data
  if (!lessonUpdateData.lessonId || typeof lessonUpdateData.spaces !== 'number') {
    return response.status(400).send('Invalid lesson update data.');
  }

  if (lessonUpdateData.spaces < 0) {
    return response.status(400).send('Remaining spaces cannot be less than 0.');
  }

  let client;
  MongoClient.connect(uri)
    .then((connectedClient) => {
      client = connectedClient;
      // Get a reference to the 'lessons' collection (or whatever collection you're using)
      const db = client.db('webapp-cw2');
      const collection = db.collection('lessons');

      // Update the lesson document
      return collection.updateOne({ id: lessonUpdateData.lessonId }, { $set: { spaces: lessonUpdateData.spaces } })
    })
    .then(result => {
      if (result.matchedCount === 0) {
        response.status(404).send(`Lesson ${lessonUpdateData.lessonId} not found.`);
      } else if (result.modifiedCount === 0) {
        response.status(304).send(`No changes made to the lesson ${lessonUpdateData.lessonId}.`);
      } else {
        response.status(200).json({ message: 'Lesson updated successfully.' });
      }
    })
    .catch(error => {
      console.error('Error updating lesson:', error);
      response.status(500).send('An error occurred while updating the lesson.');
    })
    .finally(() => {
      client.close();
    })
});

// Route to handle search requests
app.get('/search', (request, response) => {

  let client;
  // Connect to the MongoDB server
  MongoClient.connect(uri)
    .then((connectedClient) => {
      client = connectedClient;
      const database = client.db("webapp-cw2");
      const lessons = database.collection("lessons");

      // Extract the search term from the request body
      const searchTerm = request.query.term;

      // Perform a regex search using the index
      return lessons.find({
        $or: [
          { subject: { $regex: `${searchTerm}`, $options: 'i' } },
          { location: { $regex: `${searchTerm}`, $options: 'i' } }
        ]
      }).toArray();
    })
    .then((results) => {
      // Send the search results back to the client
      response.json(results);
    })
    .catch((error) => {
      console.error(error);
      response.status(500).send('Error occurred while searching');
    })
    .finally(() => {
      client.close();
    })
});

// Set up a listener for your server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;