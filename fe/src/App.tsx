import { Box, Button, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

function App() {
  const [response, setResponse] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const wsRef = useRef<WebSocket>();

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = socket;
    socket.addEventListener("message", (e) => {
      setResponse((r) => [...r, e.data]);
    });
    return () => socket.close();
  }, []);
  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h2">WebSocket Chat</Typography>
      <TextField
        label="text"
        value={message}
        onChange={(e) => {
          e.preventDefault();
          setMessage(e.target.value);
        }}
        size="small"
      />
      <Button
        onClick={(e) => {
          e.preventDefault();
          if (!wsRef.current) return;
          wsRef.current.send(message);
        }}
      >
        send
      </Button>
      <Box>
        {response.map((r, i) => {
          return (
            <Box sx={{ m: 1 }} key={i}>
              {r}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default App;
