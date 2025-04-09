import {
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@mui/material";
import TagInput from "./components/SelectWithTags";
import { FormProvider, useForm } from "react-hook-form";
import CustomAutocomplete from "./components/CustomAutocomplete";
import DateRangePicker from "./components/DateRangePicker";
import SelectTree from "./components/SelectTree";
import SelectTree2 from "./components/SelectTree2";
import SelectTree0904 from "./components/SelectTree0904";

const theme = createTheme({
  palette: {
    primary: {
      main: "#ED0231",
    },
  },
});

interface TreeNode {
  value: number | string;
  label: string;
  childrens?: TreeNode[];
}

function generateTreeData(count: number): TreeNode[] {
  let value = 1;

  function createNode(level: number): TreeNode {
    value++;
    const node: TreeNode = {
      value: `VTC-${value}`,
      label:
        level === 0
          ? `Nhóm kênh bán hàng trực tiếp ${value}`
          : `${value}/ Kênh đại lý XNK`,
    };

    if (level < 1 && value < count) {
      const childrenCount = Math.floor(Math.random() * 3) + 1;
      node.childrens = Array.from({ length: childrenCount }, () =>
        createNode(level + 1)
      );
    }

    return node;
  }

  return Array.from({ length: Math.min(10, count) }, () => createNode(0));
}
const treeData: TreeNode[] = generateTreeData(100);

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
          gap: 40,
        }}
      >
        <FormProvider {...methods}>
          {/* <TagInput value={[20, 13, 1]} /> */}
          <SelectTree0904
            options={treeData}
            onChange={(status, value) => {
              console.log({ status, value });
            }}
          />
          <DateRangePicker />
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
