// Store active connections and user data
interface UserData {
  username: string;
  cursorPosition?: { x: number; y: number };
}

const connections: Map<string, WebSocket> = new Map();
const users: Map<string, UserData> = new Map();

// // Broadcast message to all connected clients except sender
// function broadcast(message: string, excludeSocket?: WebSocket) {
//   for (const [_, socket] of connections.entries()) {
//     if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
//       socket.send(message);
//     }
//   }
// }

// Broadcast message to all connected clients including sender
function broadcast(message: string) {
  for (const [_, socket] of connections.entries()) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

Deno.serve((req) => {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.addEventListener("open", () => {
    const url = new URL(req.url);
    const id = crypto.randomUUID();
    const username = url.searchParams.get("username");

    // Store connection and user data
    connections.set(id, socket);
    users.set(id, {
      username: username || "Anonymous",
      cursorPosition: { x: 0, y: 0 },
    });

    console.log(`User ${username} (${id}) connected`);
    console.log(`Total users connected: ${users.size}`);

    // Broadcast new user joined
    broadcast(
      JSON.stringify({
        type: "userJoined",
        userId: id,
        username: username || "Anonymous",
      })
      // Broadcast message to all connected clients except sender
      // socket
    );
  });

  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);

      // Find the user ID for this socket
      const userId = Array.from(connections.entries()).find(
        ([_, sock]) => sock === socket
      )?.[0];

      // Update cursor position if valid coordinates received
      if (
        userId &&
        typeof message.x === "number" &&
        typeof message.y === "number"
      ) {
        const userData = users.get(userId);
        if (userData) {
          userData.cursorPosition = { x: message.x, y: message.y };
          users.set(userId, userData);
          console.log(`Updated cursor position for user ${userId}:`, message);

          // Broadcast cursor position update to all including sender
          broadcast(
            JSON.stringify({
              type: "cursorMove",
              userId: userId,
              username: userData.username,
              position: userData.cursorPosition,
            })
            // Broadcast message to all connected clients except sender
            // socket
          );
        }
      }
    } catch (_error) {
      console.error("Invalid message format:", event.data);
    }
  });

  socket.addEventListener("close", () => {
    // Clean up connections and user data when client disconnects
    const disconnectedId = Array.from(connections.entries()).find(
      ([_, sock]) => sock === socket
    )?.[0];

    if (disconnectedId) {
      const userData = users.get(disconnectedId);
      connections.delete(disconnectedId);
      users.delete(disconnectedId);
      console.log(`User with ID ${disconnectedId} disconnected!`);
      console.log(`Total users connected: ${users.size}`);

      // Broadcast user disconnected
      broadcast(
        JSON.stringify({
          type: "userLeft",
          userId: disconnectedId,
          username: userData?.username,
        })
      );
    }
  });

  return response;
});
