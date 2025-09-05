require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const db = require('./database/dbConfig');
const fs = require('fs');        // For reading SSL certificates
const https = require('https');  // For HTTPS
const http = require('http');    // For HTTP redirection

const app = express();
const PORT = process.env.PORT || 8005;

// Increase payload limit
app.use(express.json({ limit: '10mb' }));  // Adjust size as needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Load SSL certificates
// const sslOptions = {
//     key: fs.readFileSync('/etc/letsencrypt/live/nodehost.mydevfactory.com/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/nodehost.mydevfactory.com/fullchain.pem')
// };

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

require('./models/associations');

// Sync the database and start the HTTPS server
db.sync()
    .then(() => {
        console.log("Database synced successfully");

        // Start the HTTPS server
        // https.createServer(sslOptions, app).listen(PORT, () => {
        //     console.log(`Server is running securely on https://nodehost.mydevfactory.com:${PORT}`);
        // });

        // Redirect HTTP to HTTPS
        // http.createServer((req, res) => {
        //     res.writeHead(301, { "Location": "https://" + req.headers.host + req.url });
        //     res.end();
        // }).listen(8080);  // HTTP redirection on port 8080
        // console.log(`HTTP server is redirecting to HTTPS`);
         // Start the HTTP server
         http.createServer(app).listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Error syncing database:', error);
    });
