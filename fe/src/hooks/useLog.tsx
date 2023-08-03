import { Box, Card } from "@mui/material";
import { useCallback, useState } from "react";

function useLog() {
  const numLines = 7;
  const [messages, setMessages] = useState<{ message: string; num: number }[]>(
    []
  );

  const element = (
    <Box component={Card} sx={{ maxHeight: "9em", overflow: "scroll" }}>
      <Box sx={{ m: 1 }}>
        {(messages.length > numLines
          ? messages.slice(-numLines)
          : messages
        ).map((m) => {
          return <div key={m.num}>{m.message}</div>;
        })}
      </Box>
    </Box>
  );

  const log = useCallback((msg: string) => {
    setMessages((ms) => {
      const num = ms.length > 0 ? ms.slice(-1)[0].num : 0;
      const ret = [...ms, { message: msg, num: num + 1 }];
      return ret;
    });
  }, []);

  return { element, log };
}

export default useLog;
