import {
  useState,
  useRef,
  MouseEvent,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Chip,
  IconButton,
  Box,
  Paper,
  TextField,
  InputAdornment,
  Checkbox,
  Typography,
  ListItemButton,
} from "@mui/material";
import { ArrowDropDown, Search } from "@mui/icons-material";
import { FixedSizeList } from "react-window";
import useResizeObserver from "./useResizeObserver";
import Dropdown from "./Dropdown";
// import { NAMES } from "./constants";

interface TreeNode {
  id: number;
  name: string;
  children?: TreeNode[];
}

function generateTreeData(count: number): TreeNode[] {
  let id = 1;

  function createNode(level: number): TreeNode {
    const node: TreeNode = {
      id: id++,
      name:
        level === 0
          ? `Nhóm kênh bán hàng trực tiếp ${id}`
          : `${id}/ Kênh đại lý XNK`,
    };

    if (level < 1 && id < count) {
      const childrenCount = Math.floor(Math.random() * 10) + 1;
      node.children = Array.from({ length: childrenCount }, () =>
        createNode(level + 1)
      );
    }

    return node;
  }

  return Array.from({ length: Math.min(100, count) }, () => createNode(0));
}

const treeData1: TreeNode[] = generateTreeData(10000);

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

const getAllChildIds = (node: TreeNode): number[] => {
  let ids = [node.id];
  if (node.children) {
    node.children.forEach((child) => {
      ids = ids.concat(getAllChildIds(child));
    });
  }
  return ids;
};

const getParentIds = (
  id: number,
  parentMap: Record<number, number>
): number[] => {
  let parents: number[] = [];
  while (parentMap[id] !== undefined) {
    id = parentMap[id];
    parents.push(id);
  }
  return parents;
};

const buildParentMap = (
  nodes: TreeNode[],
  parent: TreeNode | null = null,
  map: Record<number, number> = {}
): Record<number, number> => {
  nodes.forEach((node) => {
    if (parent !== null) {
      map[node.id] = parent.id;
    }
    if (node.children) {
      buildParentMap(node.children, node, map);
    }
  });
  return map;
};

export default function SelectWithTags() {
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const { width } = useResizeObserver(containerRef);

  const handleRemove = (option: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== option));
  };

  const handleOpen = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const [selectedCounts, setSelectedCounts] = useState<
    Record<number, { total: number; selected: number }>
  >({});
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const flatList = useMemo(() => flattenTree(treeData1), []);
  const parentMap = useMemo(() => buildParentMap(treeData1), []);

  const updateSelectedCounts = (newChecked: Record<number, boolean>) => {
    const counts: Record<number, { total: number; selected: number }> = {};
    flatList.forEach((node) => {
      if (node.children) {
        const total = node.children.length;
        const selected = node.children.filter(
          (child) => newChecked[child.id]
        ).length;
        counts[node.id] = { total, selected };
      }
    });
    setSelectedCounts(counts);
  };

  const toggleCheck = (id: number, checked: boolean) => {
    setCheckedItems((prev) => {
      const newChecked = { ...prev };
      newChecked[id] = checked;

      const node = flatList.find((n) => n.id === id);
      if (node?.children) {
        node.children.forEach((child) => {
          newChecked[child.id] = checked;
        });
      }

      getParentIds(id, parentMap).forEach((parentId) => {
        const parentNode = flatList.find((n) => n.id === parentId);
        if (parentNode?.children) {
          newChecked[parentId] = parentNode.children.every(
            (child) => newChecked[child.id]
          );
        }
      });

      updateSelectedCounts(newChecked);
      return newChecked;
    });
  };

  const getTagLabels = () => {
    return Object.entries(selectedCounts)
      .filter(([parentId, { selected, total }]) => selected > 0)
      .map(([parentId, { selected, total }]) => {
        let parent = flatList.find((n) => n.id === Number(parentId));
        while (parent && parentMap[parent.id] && selected === total) {
          parent = flatList.find((n) => n.id === parentMap[parent.id]);
        }
        return parent ? `${parent.name} (${selected}/${total})` : "";
      });
  };

  const updateHiddenTags = useCallback(() => {
    if (!inputRef.current) return;
    const inputWidth = inputRef.current.offsetWidth;
    const children = Array.from(inputRef.current.children) as HTMLDivElement[];
    let totalWidth = 0;
    let visibleCount = 0;
    for (const child of children) {
      totalWidth += child.offsetWidth + 4;
      if (totalWidth > inputWidth - 50) break;
      visibleCount++;
    }
    // setHiddenCount(selectedTags.length - visibleCount);
    setHiddenCount(getTagLabels().length - visibleCount);
  }, [selectedTags, getTagLabels]);

  useLayoutEffect(() => {
    updateHiddenTags();
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        updateHiddenTags();
      }
    });
    if (inputRef.current) {
      observer.observe(inputRef.current);
    }

    return () => observer.disconnect();
  }, [selectedTags, updateHiddenTags]);

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
          onClick={() => {
            toggleCheck(item.id, !checkedItems[item.id]);
          }}
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
              flexGrow: 1,
            }}
            color={item.depth === 0 ? "primary" : "#292929"}
          >
            {item.name}
          </Typography>
        </ListItemButton>
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
          padding: "6px",
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
          {/* {selectedTags.slice(0, 30).map((tag, index) => { */}
          {getTagLabels()
            .slice(0, 30)
            .map((tag, index) => {
              return (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemove(tag)}
                  sx={{
                    ...(index >= getTagLabels().length - hiddenCount && {
                      position: "absolute",
                      pointerEvents: "none",
                      opacity: 0,
                    }),
                  }}
                />
              );
            })}
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
          <FixedSizeList height={300} itemCount={flatList.length} itemSize={42}>
            {Row}
          </FixedSizeList>
        </Paper>
      </Dropdown>
    </Box>
  );
}
