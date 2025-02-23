import { Box, CssBaseline } from "@mui/material";
import TagInput from "./components/SelectWithTags";

function App() {
  return (
    <Box>
      <CssBaseline />
      <Box sx={{ display: "flex", width: "80%", margin: "0 auto" }}>
        <TagInput />
      </Box>
    </Box>
  );
}

export default App;
