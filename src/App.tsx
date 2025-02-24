import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import TagInput from "./components/SelectWithTags";

const theme = createTheme({
  palette: {
    primary: {
      main: "#ED0231",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", width: "50%", margin: "0 auto" }}>
        <TagInput />
      </Box>
    </ThemeProvider>
  );
}

export default App;
