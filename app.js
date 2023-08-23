const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Import WebSocket handlers
const commentWebSocket = require('./src/commentWebSocket');
const notificationWebSocket = require('./src/notificationWebSocket');

commentWebSocket.setup(wss);
notificationWebSocket.setup(wss);

server.listen(8080, () => {
  console.log('Server is running on port 8080');
});
