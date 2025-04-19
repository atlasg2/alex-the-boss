import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createTheme, ThemeProvider } from "@/components/theme-provider";

// Set up with theme provider for light/dark mode support
const theme = createTheme();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" theme={theme}>
    <App />
  </ThemeProvider>
);
