import { Box, Card } from "@mui/material";
import { useState } from "react";

function useLog() {
  const [messages, setMessages] = useState<{ message: string; num: number }[]>(
    []
  );

  const element = (
    <Box component={Card} sx={{ maxHeight: "8em", overflow: "scroll" }}>
      {messages.map((m) => {
        return <div key={m.num}>{m.message}</div>;
      })}
    </Box>
  );

  const log = (msg: string) => {
    setMessages((ms) => {
      const num = ms.length > 0 ? ms.slice(-1)[0].num : 0;
      const ret = [...ms, { message: msg, num: num + 1 }];
      return ret.length >= 7 ? ret.slice(-7) : ret;
    });
  };

  return { element, log };
}

export default useLog;
