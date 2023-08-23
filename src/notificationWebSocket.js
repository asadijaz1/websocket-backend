let notifications = {};
var nextNotificationId = 1;
const WebSocket = require('ws');
function setup(wss) {
  wss.on('connection', (ws) => {
    console.log('Comment WebSocket connected');

    ws.on('message', (message) => {
      const data = JSON.parse(message);

      if (data.route === '/notification') {
        switch (data.type) {
          case 'new-notification':
            const postId = data.postId;
            const notification = data.notification;
            const notificationId = nextNotificationId++;

            if (!notifications[postId]) {
              notifications[postId] = [];
            }
            notifications[postId].push({
              id: notificationId,
              text: notification,
            });
            wss.clients.forEach((client) => {
              if (client === ws && client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: 'new-notification',
                    notifications,
                  })
                );
              }
            });

            break;

          case 'notification-read':
            const {
              notificationId: notificationIdToEdit,
              postId: postIdToEdit,
            } = data;
            if (notifications[postIdToEdit]) {
              const notificationToEdit = notifications[postIdToEdit].find(
                (notification) => notification.id === notificationIdToEdit
              );

              if (notificationToEdit) {
                notificationToEdit.read = true;

                wss.clients.forEach((client) => {
                  if (client === ws && client.readyState === WebSocket.OPEN) {
                    client.send(
                      JSON.stringify({
                        type: 'notification-read',
                        notifications,
                      })
                    );
                  }
                });
              }
            }
            break;

          case 'get-notification':
            if (notifications) {
              ws.send(
                JSON.stringify({
                  type: 'get-notification',
                  notifications,
                })
              );
            }
            break;
        }
      }
    });
  });
}

module.exports = { setup };
