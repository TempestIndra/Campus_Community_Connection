const express = require('express');
const { MongoClient } = require('mongodb');
const os = require('os'); // Import the os module
require('dotenv').config();

const app = express();
let db;

// Connect to MongoDB
async function connectDB() {
    const client = new MongoClient(process.env.mongodbURL);
    await client.connect();
    db = client.db(process.env.Database);
}

// Function to get the server's IP address
function getServerIpAddress() {
    const networkInterfaces = os.networkInterfaces();
    for (const interface in networkInterfaces) {
        for (const address of networkInterfaces[interface]) {
            // Check for IPv4 and not a loopback address
            if (address.family === 'IPv4' && !address.internal) {
                return address.address; // Return the first valid IP address found
            }
        }
    }
    return '127.0.0.1'; // Fallback to localhost if no IP is found
}

// API endpoint to get data by location_id
app.get('/api/data/:location', async (req, res) => {
    const location = req.params.location; // Get the location from the URL parameter
    const locationPattern = new RegExp(`^${location}_`); // Create a regex pattern for matching

    try {
        const data = await db.collection(process.env.Collection).find({
            location_id: { $regex: locationPattern } // Use regex to find matching location_id
        }).toArray();

        if (data.length > 0) {
            res.json(data); // Return the matching data
        } else {
            res.status(404).send({ message: 'No data found for the specified location' });
        }
    } catch (err) {
        res.status(500).send({ message: 'Error retrieving data' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
const serverIp = getServerIpAddress(); // Get the server's IP address

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`You can now access the API at http://${serverIp}:${PORT}/api/data`);
});

// Connect to the database when the server starts
connectDB().catch(console.error);