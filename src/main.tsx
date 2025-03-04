import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import DateRangePicker from "./components/DateRangePicker.tsx";
import { Box } from "@mui/material";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  // <App />
  <Box width={500}>
    <DateRangePicker />
  </Box>
  // </StrictMode>
);
