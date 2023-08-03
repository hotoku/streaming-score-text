import { Box, Slider, Stack, Typography } from "@mui/material";
import { useState } from "react";

function useSlider(name: string) {
  const [val, setVal] = useState(1);
  const elm = (
    <Stack direction="row" spacing={2}>
      <Typography sx={{ width: "3em" }} variant="h6">
        {name}
      </Typography>
      <Slider
        defaultValue={1}
        step={1}
        min={0}
        max={3}
        marks
        value={val}
        onChange={(_event, newValue) => {
          console.log("slider", name, newValue);
          setVal(newValue as number);
        }}
      />
      <Typography sx={{ width: "3em" }} variant="h6">
        {val}
      </Typography>
    </Stack>
  );
  return { val, elm };
}

function usePreference() {
  const { val: analytics, elm: analyticsSlider } = useSlider("分析");
  const { val: fact, elm: factSlider } = useSlider("事実");
  const { val: emotion, elm: emotionSlider } = useSlider("感情");

  const elm = (
    <Box>
      {analyticsSlider}
      {factSlider}
      {emotionSlider}
    </Box>
  );

  return { analytics, fact, emotion, elm };
}

export default usePreference;
