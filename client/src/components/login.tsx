import { Dispatch, SetStateAction, useState } from "react";

export const Login = ({
  onSubmit,
}: {
  onSubmit: Dispatch<SetStateAction<string>>;
}) => {
  const [username, setUsername] = useState("");
  return (
    <>
      <h1>Welcome</h1>
      <p>What should people call you?</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(username);
        }}
      >
        <input
          type="text"
          value={username}
          placeholder="username"
          onChange={(e) => setUsername(e.target.value)}
          className="text-gray-800"
        />
        <input type="submit" />
      </form>
    </>
  );
};
