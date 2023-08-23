let comments = {};
var nextCommentId = 1;
const WebSocket = require('ws');
function setup(wss) {
  wss.on('connection', (ws) => {
    console.log('Comment WebSocket connected');

    ws.on('message', (message) => {
      const data = JSON.parse(message);

      if (data.route === '/comment') {
        switch (data.type) {
          case 'new-comment':
            const postId = data.postId;
            const commentText = data.comment;
            const commentId = nextCommentId++;

            if (!comments[postId]) {
              comments[postId] = [];
            }
            comments[postId].push({ id: commentId, text: commentText });

            wss.clients.forEach((client) => {
              const postIdToRetrieve = data.postId;
              if (comments[postIdToRetrieve]) {
                if (client.readyState === WebSocket.OPEN) {
                  const existingComments = comments[postIdToRetrieve];
                  ws.send(
                    JSON.stringify({
                      type: 'new-comments',
                      postId: postIdToRetrieve,
                      comments: existingComments,
                    })
                  );
                }
              }
            });

            break;

          case 'get-comments':
            console.log('test');
            const postIdToRetrieve = data.postId;
            if (comments[postIdToRetrieve]) {
              const existingComments = comments[postIdToRetrieve];
              ws.send(
                JSON.stringify({
                  type: 'get-comments',
                  postId: postIdToRetrieve,
                  comments: existingComments,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  type: 'get-comments',
                  postId: postIdToRetrieve,
                  comments: [],
                })
              );
            }
            break;

          case 'edit-comment':
            const {
              postId: postIdToEdit,
              commentId: commentIdToEdit,
              newText,
            } = data;
            if (comments[postIdToEdit]) {
              const commentToEdit = comments[postIdToEdit].find(
                (comment) => comment.id === commentIdToEdit
              );
              if (commentToEdit) {
                commentToEdit.text = newText;

                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(
                      JSON.stringify({
                        type: 'new-comment',
                        postId,
                        comment: {
                          type: 'edited-comment',
                          postId: postIdToEdit,
                          commentId: commentIdToEdit,
                          newText,
                        },
                      })
                    );
                  }
                });
              }
            }
            break;

          case 'delete-comment':
            const { postId: postIdToDelete, commentId: commentIdToDelete } =
              data;
            if (comments[postIdToDelete]) {
              const commentIndexToDelete = comments[postIdToDelete].findIndex(
                (comment) => comment.id === commentIdToDelete
              );

              if (commentIndexToDelete !== -1) {
                const deletedComment = comments[postIdToDelete].splice(
                  commentIndexToDelete,
                  1
                )[0];

                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(
                      JSON.stringify({
                        type: 'new-comment',
                        postId,
                        comment: {
                          type: 'deleted-comment',
                          postId: postIdToDelete,
                          commentId: commentIdToDelete,
                        },
                      })
                    );
                  }
                });
              }
            }
            break;
        }
      }
    });
  });
}

module.exports = { setup };
