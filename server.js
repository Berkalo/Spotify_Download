// server.js

const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors'); // Import CORS

const app = express();
const port = process.env.PORT || 8888;

// Spotify credentials
const client_id = 'd7311acd78154d2c8b8b47e41d2fe218';
const client_secret = 'bd097caaba454319a2f262a609fd3ce4';

let cachedToken = null;
let tokenExpiryTime = null;

// Use CORS middleware
app.use(cors());

async function getSpotifyToken() {
    // Check if token is still valid
    if (cachedToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
        return cachedToken;
    }

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
            grant_type: 'client_credentials'
        }), {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        cachedToken = response.data.access_token;
        tokenExpiryTime = Date.now() + (response.data.expires_in * 1000); // Token validity is given in seconds

        return cachedToken;
    } catch (error) {
        console.error('Error fetching Spotify token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch Spotify token');
    }
}

app.get('/', (req, res) => {
    res.send('Spotify Token Backend is Running');
});

// Endpoint to get Spotify token
app.get('/get-token', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        res.json({ token });
    } catch (error) {
        res.status(500).send('Error fetching Spotify token');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});