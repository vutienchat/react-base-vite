import {
  useState,
  useRef,
  MouseEvent,
  useLayoutEffect,
  useCallback,
  useMemo,
  forwardRef,
} from "react";
import {
  Chip,
  IconButton,
  Box,
  Paper,
  TextField,
  InputAdornment,
  Checkbox,
  Button,
  Typography,
  ListItem,
  ListItemButton,
} from "@mui/material";
import { ArrowDropDown, Search } from "@mui/icons-material";
import { FixedSizeList } from "react-window";
import useResizeObserver from "./useResizeObserver";
import Dropdown from "./Dropdown";

const options: string[] = [
  "apple",
  "banana",
  "cherry",
  "dog",
  "elephant",
  "one",
  "two",
  "three",
  "four",
  "five",
];

interface TreeNode {
  id: number;
  name: string;
  children?: TreeNode[];
}

const treeData: TreeNode[] = [
  {
    id: 1,
    name: "Nhóm kênh bán hàng trực tiếp",
    children: [
      { id: 2, name: "14/ Kênh nhân viên" },
      {
        id: 3,
        name: "1001527/ Kênh hộ kinh doanh",
      },
    ],
  },
  {
    id: 4,
    name: "Nhóm kênh khác",
    children: [
      { id: 5, name: "1000499/ Kênh đại lý ủy quyền doanh nghiệp" },
      {
        id: 6,
        name: "6/ Kênh đại lý XNK",
      },
    ],
  },
  {
    id: 7,
    name: "Nhóm kênh khác 2",
    children: [
      { id: 8, name: "7/ Kênh đại lý XNK" },
      {
        id: 9,
        name: "8/ Kênh đại lý XNK",
      },
    ],
  },
];

interface FlatNode extends TreeNode {
  depth: number;
  isLast: boolean;
}

const flattenTree = (nodes: TreeNode[], depth = 0): FlatNode[] => {
  let result: FlatNode[] = [];
  nodes.forEach((node, index, array) => {
    result.push({ ...node, depth, isLast: index === array.length - 1 });
    if (node.children) {
      result = result.concat(flattenTree(node.children, depth + 1));
    }
  });
  return result;
};

export default function SelectWithTags() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width } = useResizeObserver(containerRef);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);

  const updateHiddenTags = useCallback(() => {
    if (!inputRef.current) return;
    const containerWidth = inputRef.current.offsetWidth;
    const children = Array.from(inputRef.current.children) as HTMLDivElement[];
    let totalWidth = 0;
    let visibleCount = 0;

    for (const child of children) {
      totalWidth += child.offsetWidth + 4;
      if (totalWidth > containerWidth - 50) break;
      visibleCount++;
    }
    setHiddenCount(selectedTags.length - visibleCount);
  }, [selectedTags]);

  useLayoutEffect(() => {
    updateHiddenTags();
    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        updateHiddenTags();
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    updateHiddenTags();
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [selectedTags, updateHiddenTags]);

  const handleSelect = (option: string) => {
    if (!selectedTags.includes(option)) {
      setSelectedTags((prev) => [...prev, option]);
    }
  };

  const handleRemove = (option: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== option));
    // updateHiddenTags();
  };

  const handleOpen = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const flatList = useMemo(() => flattenTree(treeData), []);

  const toggleCheck = (id: number) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = flatList[index];
    return (
      <Box
        style={style}
        sx={{
          paddingLeft: `${item.depth * 20}px`,
          ...(item.isLast && { borderBottom: "1px solid #F2F2F2" }),
        }}
      >
        <ListItemButton
          selected={!!checkedItems[item.id]}
          onClick={() => toggleCheck(item.id)}
          style={{ minWidth: 0, paddingBlock: 0 }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#F2F2F2",
            },
          }}
        >
          <Checkbox checked={!!checkedItems[item.id]} readOnly />
          <Typography
            noWrap
            sx={{
              color: item.depth === 0 ? "#ED0231" : "#292929",
              flexGrow: 1,
            }}
          >
            {item.name}
          </Typography>
        </ListItemButton>
        {/* <Checkbox
          checked={!!checkedItems[item.id]}
          onChange={() => toggleCheck(item.id)}
        />
        <Typography>
          {item.name}
        </Typography> */}
      </Box>
    );
  };

  return (
    <Box onClick={handleOpen} ref={containerRef} width="100%">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: "10px",
          width: 1,
          cursor: "pointer",
        }}
      >
        <Box
          ref={inputRef}
          sx={{
            display: "flex",
            flexWrap: "nowrap",
            gap: 0.5,
            flex: 1,
            overflow: "hidden",
          }}
        >
          {selectedTags.map((tag, index) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleRemove(tag)}
              sx={{
                display:
                  index < selectedTags.length - hiddenCount
                    ? "inline-flex"
                    : "none",
              }}
            />
          ))}
          {hiddenCount > 0 && (
            <Chip
              label={`+${hiddenCount}`}
              sx={{ backgroundColor: "grey.300" }}
            />
          )}
        </Box>
        <IconButton size="small">
          <ArrowDropDown />
        </IconButton>
      </Box>
      <Dropdown
        anchorEl={anchorEl}
        open={!!anchorEl}
        handleClose={handleClose}
        width={width}
      >
        <Paper>
          <Box sx={{ px: 1, pt: 1, pb: "10px" }}>
            <TextField
              variant="outlined"
              fullWidth
              InputProps={{
                style: { height: 40 },
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          {/* {options.map((option) => (
            <Box
              key={option}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px",
                cursor: "pointer",
                "&:hover": { bgcolor: "grey.200" },
              }}
              onClick={() => handleSelect(option)}
            >
              {option} <div>x</div>
            </Box>
          ))} */}
          <FixedSizeList height={300} itemCount={flatList.length} itemSize={42}>
            {Row}
          </FixedSizeList>
        </Paper>
      </Dropdown>
    </Box>
  );
}
