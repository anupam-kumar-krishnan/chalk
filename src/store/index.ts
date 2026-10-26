import { configureStore } from "@reduxjs/toolkit";
import canvas from "./canvasSlice";
import doc from "./docSlice";
import ui from "./uiSlice";

export const makeStore = () => configureStore({ reducer: { canvas, doc, ui } });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
