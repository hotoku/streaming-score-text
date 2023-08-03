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
import useLog from "./hooks/useLog";
import useNormalize from "./hooks/useNormalize";
import usePreference from "./hooks/usePreference";
import { ScoreResponse } from "./types";

function App() {
  const [response, setResponse] = useState<
    (ScoreResponse & { value: number })[]
  >([]);
  const wsRef = useRef<WebSocket>();
  const pref = usePreference();
  const normalize = useNormalize();
  const { element: logNode, log } = useLog();

  useEffect(() => {
    const port = process.env.REACT_APP_DEVELOPMENT ? 8000 : 10080;
    const url = `ws://${window.location.hostname}:${port}/ws`;
    log(`opening websocket connection ${url}`);
    const socket = new WebSocket(url);
    socket.addEventListener("close", () => {
      log("websocket connection is closed");
    });
    wsRef.current = socket;
    return () => socket.close();
  }, [log]);

  const calcScore = useCallback(
    (obj: { analytics: number; fact: number; emotion: number }) => {
      const an =
        (obj.analytics - normalize.analytics.mu) /
        Math.sqrt(normalize.analytics.sigma2);
      const fa =
        (obj.fact - normalize.fact.mu) / Math.sqrt(normalize.fact.sigma2);
      const em =
        (obj.emotion - normalize.emotion.mu) /
        Math.sqrt(normalize.emotion.sigma2);
      const score = an * pref.analytics + fa * pref.fact + em * pref.emotion;

      return score;
    },
    [normalize, pref]
  );

  const updateNormalize = useCallback(
    (obj: { analytics: number; fact: number; emotion: number }) => {
      normalize.updateAnalytics(obj.analytics);
      normalize.updateFact(obj.fact);
      normalize.updateEmotion(obj.emotion);
    },
    [normalize]
  );

  useEffect(() => {
    if (!wsRef.current) return;

    const socket = wsRef.current;
    const listner = (e: MessageEvent) => {
      log(`receive message ${response.length + 1}`);
      const ret: ScoreResponse = JSON.parse(e.data);
      updateNormalize(ret.scores);
      const score = calcScore(ret.scores);
      setResponse((r) => [...r, { ...ret, value: score }]);
    };
    socket.addEventListener("message", listner);
    return () => socket.removeEventListener("message", listner);
  }, [response, log, calcScore, updateNormalize]);

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h2">Text Score Streaming</Typography>
      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: "50%" }}>
          {pref.elm}
          <Button
            onClick={() => {
              if (!wsRef.current) return;
              const socket = wsRef.current;
              log("一時停止");
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
              log("再開");
              socket.send(
                JSON.stringify({
                  type: "start",
                })
              );
            }}
          >
            再開
          </Button>
        </Box>
        <Box sx={{ width: "50%" }}>{logNode}</Box>
      </Box>
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
