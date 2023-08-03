import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import usePreference from "./hooks/usePreference";
import { ScoreResponse } from "./types";

function App() {
  const [response, setResponse] = useState<
    (ScoreResponse & { value: number })[]
  >([]);
  const wsRef = useRef<WebSocket>();
  const pref = usePreference();
  const calcScore = useCallback(
    (obj: { analytics: number; fact: number; emotion: number }) => {
      const score =
        obj.analytics * pref.analytics +
        obj.fact * pref.fact +
        obj.emotion * pref.emotion;

      return score;
    },
    [pref]
  );

  useEffect(() => {
    const port = process.env.REACT_APP_DEVELOPMENT ? 8000 : 10080;
    const url = `ws://${window.location.hostname}:${port}/ws`;
    console.log("url", url);
    const socket = new WebSocket(url);
    wsRef.current = socket;
    return () => socket.close();
  }, []);

  useEffect(() => {
    if (!wsRef.current) return;
    const socket = wsRef.current;
    const listner = (e: MessageEvent) => {
      const ret: ScoreResponse = JSON.parse(e.data);
      const score = calcScore(ret.scores);
      setResponse((r) => [...r, { ...ret, value: score }]);
    };
    socket.addEventListener("message", listner);
    return () => socket.removeEventListener("message", listner);
  }, [calcScore]);
  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h2">Text Score Streaming</Typography>
      {pref.elm}
      <Button
        onClick={() => {
          if (!wsRef.current) return;
          const socket = wsRef.current;
          socket.send(
            JSON.stringify({
              type: "stop",
            })
          );
        }}
      >
        一時停止
      </Button>
      <Button
        onClick={() => {
          if (!wsRef.current) return;
          const socket = wsRef.current;
          socket.send(
            JSON.stringify({
              type: "start",
            })
          );
        }}
      >
        再開
      </Button>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>テキスト</TableCell>
              <TableCell sx={{ minWidth: "3em" }}>分析</TableCell>
              <TableCell sx={{ minWidth: "3em" }}>事実</TableCell>
              <TableCell sx={{ minWidth: "3em" }}>感情</TableCell>
              <TableCell sx={{ minWidth: "4em" }}>スコア</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {response
              .map((r, i) => {
                const color = r.value > 0 ? "black" : "gray";
                return (
                  <TableRow key={i}>
                    <TableCell sx={{ color: color }}>{r.input}</TableCell>
                    <TableCell>{r.scores.analytics.toFixed(2)}</TableCell>
                    <TableCell>{r.scores.fact.toFixed(2)}</TableCell>
                    <TableCell>{r.scores.emotion.toFixed(2)}</TableCell>
                    <TableCell>{r.value.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })
              .reverse()}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default App;
