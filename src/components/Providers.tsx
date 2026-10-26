"use client";
import { ReactNode, useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "@/store";

export default function Providers({ children }: { children: ReactNode }) {
  const ref = useRef<AppStore>(null);
  if (!ref.current) ref.current = makeStore();
  return <Provider store={ref.current}>{children}</Provider>;
}
