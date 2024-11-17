interface UserListProps {
  cursors: Map<string, any>;
  currentUserId: string | null;
  currentUsername: string;
}

export function UserList({
  cursors,
  currentUserId,
  currentUsername,
}: UserListProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-700 p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="text-lg font-semibold mb-2">Online Users</h3>
      <ul className="space-y-2">
        {/* Show current user first */}
        <li className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-black" />
          <span>{currentUsername} (You)</span>
        </li>
        {/* Show other users */}
        {Array.from(cursors.values())
          .filter((cursor) => cursor.userId !== currentUserId)
          .map((cursor) => (
            <li
              key={cursor.userId}
              className="flex items-center gap-2"
              style={{ opacity: cursor.isIdle ? 0.5 : 1 }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cursor.color }}
              />
              <span>
                {cursor.username} {cursor.isIdle && "(idle)"}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
