import useWebSocket from "react-use-websocket";
import React, { useEffect, useRef, useState } from "react";
import throttle from "lodash.throttle";
import { Cursor } from "./cursor";
import { UserList } from "./user-list";

type CursorData = {
  type:
    | "cursorMove"
    | "userJoined"
    | "userLeft"
    | "userIdle"
    | "userActive"
    | "initialState";
  userId: string;
  username: string;
  color?: string;
  position?: {
    x: number;
    y: number;
  };
  isIdle?: boolean;
  users?: Array<{
    userId: string;
    username: string;
    cursorPosition?: { x: number; y: number };
    color: string;
    isIdle: boolean;
  }>;
};

export function Home({ username }: { username: string }) {
  const WS_URL = `ws://127.0.0.1:8000`;
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(WS_URL, {
    queryParams: { username },
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const THROTTLE = 50;

  const sendJsonMessageThrottled = useRef(
    throttle(sendJsonMessage, THROTTLE, { leading: true })
  );

  const data: CursorData = lastJsonMessage as CursorData;
  // Set current user ID when joining
  useEffect(() => {
    if (data?.type === "initialState") {
      setCurrentUserId(data?.userId);
    }
  }, [data?.type, data?.userId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isConnected) {
        sendJsonMessageThrottled.current({
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected, sendJsonMessage]);

  useEffect(() => {
    if (lastJsonMessage) {
      const data = lastJsonMessage as CursorData;

      if (data.type === "initialState") {
        const newCursors = new Map();
        data.users?.forEach((user) => {
          // Don't add cursor for current user
          if (user.userId !== data.userId) {
            newCursors.set(user.userId, {
              type: "cursorMove",
              userId: user.userId,
              username: user.username,
              position: user.cursorPosition,
              color: user.color,
              isIdle: user.isIdle,
            });
          }
        });
        setCursors(newCursors);
      } else {
        setCursors((prev) => {
          const newCursors = new Map(prev);
          // Don't show cursor for current user
          if (data.userId === currentUserId) {
            return newCursors;
          }
          if (data.type === "userLeft") {
            newCursors.delete(data.userId);
          } else {
            newCursors.set(data.userId, data);
          }
          return newCursors;
        });
      }
    }
  }, [lastJsonMessage, currentUserId]);

  return (
    <div className="min-h-screen bg-gray-900 p-4 overflow-hidden">
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-400 p-2 text-center">
          Reconnecting...
        </div>
      )}

      <UserList
        cursors={cursors}
        currentUserId={currentUserId}
        currentUsername={username}
      />
      {Array.from(cursors.values()).map((cursor) =>
        cursor.userId !== currentUserId ? (
          <Cursor
            key={cursor.userId}
            point={
              cursor.position ? [cursor.position.x, cursor.position.y] : [0, 0]
            }
            color={cursor.color}
            username={cursor.username}
            isIdle={cursor.isIdle}
          />
        ) : (
          <Cursor
            key={currentUserId}
            point={
              cursor.position ? [cursor.position.x, cursor.position.y] : [0, 0]
            }
            color={"#000"} // Default black for self
            username={username}
            isIdle={cursor.isIdle} // Assuming you're never idle on your own view
          />
        )
      )}
    </div>
  );
}
