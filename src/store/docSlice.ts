import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const html =
  "<h2>Checkout flow</h2><p>Write one chain per line, select it, then press the sparkle button.</p>" +
  "<p>Customer -&gt; Web app -&gt; Orders API -&gt; Payments</p><p>Orders API -&gt; Inventory</p><p>Payments -&gt; Email receipt</p>";
const text =
  "Checkout flow\nWrite one chain per line, select it, then press the sparkle button.\n" +
  "Customer -> Web app -> Orders API -> Payments\nOrders API -> Inventory\nPayments -> Email receipt";

const slice = createSlice({
  name: "doc",
  initialState: { title: "Checkout service", content: html, text },
  reducers: {
    setDoc: (s, a: PayloadAction<{ html: string; text: string }>) => {
      s.content = a.payload.html;
      s.text = a.payload.text;
    },
    setTitle: (s, a: PayloadAction<string>) => {
      s.title = a.payload;
    },
  },
});
export const { setDoc, setTitle } = slice.actions;
export default slice.reducer;
