import {
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@mui/material";
import TagInput from "./components/SelectWithTags";
import CustomAutocomplete from "./components/CustomAutocomplete";
import { FormProvider, useForm } from "react-hook-form";

const theme = createTheme({
  palette: {
    primary: {
      main: "#ED0231",
    },
  },
});

function App() {
  const methods = useForm();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          width: "50%",
          margin: "0 auto",
          flexDirection: "column",
          gap: 30,
        }}
      >
        <FormProvider {...methods}>
          <TagInput />
          <CustomAutocomplete
            variant="standard"
            renderLabel={(option) => (
              <Box>
                <Typography variant="body1">{option.primaryText}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.secondaryText}
                </Typography>
              </Box>
            )}
            renderValue={(option) => (
              <Box>
                <Typography variant="body1">{option.primaryText}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.secondaryText}
                </Typography>
              </Box>
            )}
            onFilter={(options, searchValue) => {
              const newSearchValue = searchValue.trim().toLowerCase();
              return options.filter(
                (option) =>
                  option.label?.toLowerCase().includes(newSearchValue) ||
                  option.secondaryText?.toLowerCase().includes(newSearchValue)
              );
            }}
            options={[
              {
                value: 1,
                label: "Option 1",
                primaryText: "Option 1",
                secondaryText: "Description 1",
              },
              {
                value: 2,
                label: "Option 2",
                primaryText: "Option 2",
                secondaryText: "Description 2",
              },
              {
                value: 3,
                label: "Option 3",
                primaryText: "Option 3",
                secondaryText: "Description 3",
              },
              {
                value: 4,
                label: "Option 4",
                primaryText: "Option 4",
                secondaryText: "Description 4",
              },
              {
                value: 5,
                label: "Option 5",
                primaryText: "Option 5",
                secondaryText: "Description 5",
              },
              {
                value: 6,
                label: "Option 6",
                primaryText: "Option 6",
                secondaryText: "Description 6",
              },
              {
                value: 7,
                label: "Option 7",
                primaryText: "Option 7",
                secondaryText: "Description 7",
              },
            ]}
            name="name 1"
            heightOption={56}
            placeholder="placeholder"
          />
        </FormProvider>
      </Box>
    </ThemeProvider>
  );
}

export default App;
