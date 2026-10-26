import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ViewMode = "doc" | "diagram" | "both";
const slice = createSlice({
  name: "ui",
  initialState: { mode: "both" as ViewMode, split: 50 },
  reducers: {
    setMode: (s, a: PayloadAction<ViewMode>) => { s.mode = a.payload; },
    setSplit: (s, a: PayloadAction<number>) => { s.split = Math.min(80, Math.max(20, a.payload)); },
  },
});
export const { setMode, setSplit } = slice.actions;
export default slice.reducer;
