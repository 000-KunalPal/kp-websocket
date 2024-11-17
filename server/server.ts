/**
 * Full live cursor implementaion of live cursors with deno2
 */

interface UserData {
  username: string;
  cursorPosition?: { x: number; y: number };
  color: string;
  isIdle: boolean;
  lastActivity: number;
}

interface CursorMessage {
  type:
    | "cursorMove"
    | "userJoined"
    | "userLeft"
    | "userIdle"
    | "userActive"
    | "initialState";
  userId: string;
  username: string;
  position?: { x: number; y: number };
  color?: string;
  isIdle?: boolean;
  users?: Array<{
    userId: string;
    username: string;
    cursorPosition?: { x: number; y: number };
    color: string;
    isIdle: boolean;
  }>;
}

const connections: Map<string, WebSocket> = new Map();
const users: Map<string, UserData> = new Map();

function getRandomColor(): string {
  const colors = [
    "#FF0000", // Red
    "#00FF00", // Lime
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Fuchsia
    "#00FFFF", // Aqua
    "#FFA500", // Orange
    "#800080", // Purple
    "#008000", // Green
    "#FFC0CB", // Pink
    "#800000", // Maroon
    "#008080", // Teal
    "#000000", // Black
    "#808080", // Gray
    "#FFFFFF", // White
    "#FF4500", // OrangeRed
    "#2E8B57", // SeaGreen
    "#1E90FF", // DodgerBlue
    "#FFD700", // Gold
    "#ADFF2F", // GreenYellow
    "#DC143C", // Crimson
    "#00CED1", // DarkTurquoise
    "#4B0082", // Indigo
    "#8B0000", // DarkRed
    "#006400", // DarkGreen
    "#4682B4", // SteelBlue
    "#DAA520", // GoldenRod
    "#7B68EE", // MediumSlateBlue
    "#20B2AA", // LightSeaGreen
    "#5F9EA0", // CadetBlue
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createMessage(
  type: CursorMessage["type"],
  userId: string,
  userData: UserData,
  extras?: Partial<CursorMessage>
): CursorMessage {
  return {
    type,
    userId,
    username: userData.username,
    position: userData.cursorPosition,
    color: userData.color,
    isIdle: userData.isIdle,
    ...extras,
  };
}

function broadcast(message: CursorMessage, excludeSocket?: WebSocket) {
  const messageString = JSON.stringify(message);
  for (const [_, socket] of connections.entries()) {
    if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
      socket.send(messageString);
    }
  }
}

// Check for idle users
setInterval(() => {
  const now = Date.now();
  for (const [userId, userData] of users.entries()) {
    if (!userData.isIdle && now - userData.lastActivity > 30000) {
      userData.isIdle = true;
      const message = createMessage("userIdle", userId, userData);
      broadcast(message);
    }
  }
}, 5000);

Deno.serve((req) => {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.addEventListener("open", () => {
    const url = new URL(req.url);
    const id = crypto.randomUUID();
    const username = url.searchParams.get("username") || "Anonymous";

    const userData: UserData = {
      username,
      color: getRandomColor(),
      isIdle: false,
      lastActivity: Date.now(),
      cursorPosition: { x: 0, y: 0 },
    };

    // Store connection and user data
    connections.set(id, socket);
    users.set(id, userData);

    // Send initial state to new user
    const initialStateMessage: CursorMessage = {
      type: "initialState",
      userId: id,
      username,
      users: Array.from(users.entries()).map(([userId, userData]) => ({
        userId,
        username: userData.username,
        cursorPosition: userData.cursorPosition,
        color: userData.color,
        isIdle: userData.isIdle,
      })),
    };
    socket.send(JSON.stringify(initialStateMessage));

    // Broadcast new user joined
    const joinMessage = createMessage("userJoined", id, userData);
    broadcast(joinMessage, socket);
  });

  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);
      const userId = Array.from(connections.entries()).find(
        ([_, sock]) => sock === socket
      )?.[0];

      if (userId) {
        const userData = users.get(userId);
        if (userData) {
          userData.lastActivity = Date.now();

          if (userData.isIdle) {
            userData.isIdle = false;
            const activeMessage = createMessage("userActive", userId, userData);
            broadcast(activeMessage);
          }

          if (typeof message.x === "number" && typeof message.y === "number") {
            userData.cursorPosition = { x: message.x, y: message.y };
            users.set(userId, userData);

            const moveMessage = createMessage("cursorMove", userId, userData);
            broadcast(moveMessage, socket);
          }
        }
      }
    } catch (error) {
      console.error("Invalid message format:", error);
    }
  });

  socket.addEventListener("close", () => {
    const disconnectedId = Array.from(connections.entries()).find(
      ([_, sock]) => sock === socket
    )?.[0];

    if (disconnectedId) {
      const userData = users.get(disconnectedId);
      if (userData) {
        const leftMessage = createMessage("userLeft", disconnectedId, userData);
        connections.delete(disconnectedId);
        users.delete(disconnectedId);
        broadcast(leftMessage);
      }
    }
  });

  return response;
});
