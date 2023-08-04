import {
  Box,
  Button,
  FormControlLabel,
  Switch,
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
import { Score, ScoreResponse } from "./types";

function App() {
  const [response, setResponse] = useState<
    (ScoreResponse & { normalized: Score; show: boolean })[]
  >([]);
  const wsRef = useRef<WebSocket>();
  const pref = usePreference();
  const normalize = useNormalize();
  const { element: logNode, log } = useLog();
  const [showAll, setShowAll] = useState(false);

  /**
   * マウント時に、WebSocketの接続を開く。
   */
  useEffect(() => {
    const protocol = process.env.REACT_APP_DEVELOPMENT ? "ws" : "wss";
    const port = process.env.REACT_APP_DEVELOPMENT ? 8000 : 443;
    const url = `${protocol}://${window.location.hostname}:${port}/ws`;
    log(`opening websocket connection ${url}`);
    const socket = new WebSocket(url);
    socket.addEventListener("close", () => {
      log("websocket connection is closed");
    });
    wsRef.current = socket;
    return () => socket.close();
  }, [log]);

  /**
   * 標準化されたスコアを返す。
   */
  const calcNormalize = useCallback(
    (obj: Score): Score => {
      const analytics =
        (obj.analytics - normalize.analytics.mu) /
        Math.sqrt(normalize.analytics.sigma2);
      const fact =
        (obj.fact - normalize.fact.mu) / Math.sqrt(normalize.fact.sigma2);
      const emotion =
        (obj.emotion - normalize.emotion.mu) /
        Math.sqrt(normalize.emotion.sigma2);
      return { analytics, fact, emotion };
    },
    [normalize]
  );

  /**
   * ユーザーの好みと、標準化されたスコアから、コメントの表示可否を判断する。
   */
  const showComment = useCallback((pref: Score, score: Score): boolean => {
    /**
     * pref = 0 => false
     * pref = 1 => score > 1.5
     * pref = 2 => score > 1.0
     * pref = 3 => score > 0
     */
    const func = (p: number, s: number): boolean => {
      if (p == 0) return false;
      if (p == 1) return s > 1.5;
      if (p == 2) return s > 1.0;
      if (p == 3) return s > 0;
      throw new Error(`p is invalid: ${p}`);
    };
    return (
      func(pref.analytics, score.analytics) ||
      func(pref.fact, score.fact) ||
      func(pref.emotion, score.emotion)
    );
  }, []);

  const updateNormalize = useCallback(
    (obj: Score) => {
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
      const ret: ScoreResponse = JSON.parse(e.data);
      updateNormalize(ret.scores);
      const normScore = calcNormalize(ret.scores);
      const show = showComment(pref, normScore);
      log(
        `receive message ${response.length + 1}: ` +
          `${normScore.analytics.toFixed(2)}, ` +
          `${normScore.fact.toFixed(2)}, ` +
          `${normScore.emotion.toFixed(2)}, ` +
          `${show ? "show" : "no show"}`
      );
      setResponse((r) => [...r, { ...ret, normalized: normScore, show: show }]);
    };
    socket.addEventListener("message", listner);
    return () => socket.removeEventListener("message", listner);
  }, [response, log, showComment, updateNormalize, normalize]);

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h2">Text Score Streaming</Typography>
      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: "30%" }}>
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
          <Button
            onClick={() => {
              if (!wsRef.current) return;
              const socket = wsRef.current;
              log("最初から");
              setResponse([]);
              socket.send(
                JSON.stringify({
                  type: "restart",
                })
              );
            }}
          >
            最初から
          </Button>
          <FormControlLabel
            control={
              <Switch
                checked={showAll}
                onChange={(e) => {
                  setShowAll(e.target.checked);
                }}
              />
            }
            label="すべて表示"
          />
        </Box>
        <Box sx={{ width: "70%" }}>{logNode}</Box>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>テキスト</TableCell>
              <TableCell sx={{ minWidth: "6em" }}>分析</TableCell>
              <TableCell sx={{ minWidth: "6em" }}>事実</TableCell>
              <TableCell sx={{ minWidth: "6em" }}>感情</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {response
              .map((r, i) => {
                if (!showAll && !r.show) return undefined;
                const color = r.show ? "black" : "gray";
                const norm = r.normalized;
                return (
                  <TableRow key={i}>
                    <TableCell sx={{ color: color }}>{r.input}</TableCell>
                    <TableCell>
                      {r.scores.analytics.toFixed(2)} /{" "}
                      <Box
                        component="span"
                        sx={{ color: norm.analytics > 0 ? "blue" : "black" }}
                      >
                        {norm.analytics.toFixed(2)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {r.scores.fact.toFixed(2)} /{" "}
                      <Box
                        component="span"
                        sx={{ color: norm.fact > 0 ? "blue" : "black" }}
                      >
                        {norm.fact.toFixed(2)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {r.scores.emotion.toFixed(2)} /{" "}
                      <Box
                        component="span"
                        sx={{ color: norm.emotion > 0 ? "blue" : "black" }}
                      >
                        {norm.emotion.toFixed(2)}
                      </Box>
                    </TableCell>
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
