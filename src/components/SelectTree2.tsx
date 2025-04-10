import {
  useState,
  useRef,
  MouseEvent,
  useLayoutEffect,
  useCallback,
  useMemo,
  useEffect,
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
import IndeterminateCheckBoxOutlinedIcon from "@mui/icons-material/IndeterminateCheckBoxOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

type IValue = number | string;
interface IOption {
  value: IValue;
  label: string;
  children?: FlatNode[];
  //   [x: string]: any;
}

interface FlatNode extends IOption {
  depth?: number;
  parentId?: IValue | null;
  isFirst?: boolean;
}

interface ISelectTreeProps {
  options: IOption[];
  value?: number[];
  onChange?: (value: (string | number)[]) => void;
}

const flattenTree = (
  nodes: IOption[],
  depth = 0,
  parentId: IValue | null = null
): FlatNode[] => {
  let result: FlatNode[] = [];
  nodes.forEach((node) => {
    result.push({ ...node, depth, parentId });
    if (node.children) {
      result = result.concat(
        flattenTree(node.children as FlatNode[], depth + 1, node.value)
      );
    }
  });
  return result;
};

const getParentIds = (
  id: IValue,
  parentMap: Record<IValue, IValue>
): IValue[] => {
  const parents: IValue[] = [];
  while (parentMap[id] !== undefined) {
    id = parentMap[id];
    parents.push(id);
  }
  return parents;
};

const buildParentMap = (
  nodes: IOption[],
  parent: IOption | null = null,
  map: Record<IValue, IValue> = {}
): Record<IValue, IValue> => {
  nodes.forEach((node) => {
    if (parent !== null) {
      map[node.value] = parent.value;
    }
    if (node.children) {
      buildParentMap(node.children, node, map);
    }
  });
  return map;
};

const addIsFirstFlag = (data: IOption[]) =>
  data.map((item) => ({ ...item, isFirst: true }));

const SelectTree2 = (props: ISelectTreeProps) => {
  const { value, onChange, options = [] } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const { width } = useResizeObserver(containerRef);
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCounts, setSelectedCounts] = useState(
    new Map<IValue, { total: number; selected: number }>()
  );
  const [checkedItems2, setCheckedItems2] = useState(
    new Map<IValue, { groupIds: IValue; childIds: IValue }>()
  );
  const [checkedItems, setCheckedItems] = useState<Record<IValue, boolean>>({});
  const flatList = useMemo(() => {
    const result: IOption[] = [];
    options.forEach((item) => {
      if (item.label.includes(searchText)) {
        result.push(item);
      } else {
        const matchedChildren =
          item.children?.filter((child) => child.label.includes(searchText)) ||
          [];
        if (matchedChildren.length > 0) {
          result.push({ ...item, children: matchedChildren });
        }
      }
    });
    return flattenTree(addIsFirstFlag(result));
  }, [options, searchText]);
  const parentMap = useMemo(() => buildParentMap(options), [options]);

  const handleOpen = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    onChange?.(Object.keys(checkedItems));
  };

  const allChecked = useMemo(() => {
    return (
      flatList.length > 0 && flatList.every((node) => checkedItems[node.value])
    );
  }, [checkedItems, flatList]);

  const indeterminate = useMemo(() => {
    return !allChecked && Object.keys(checkedItems).length > 0;
  }, [allChecked, checkedItems]);

  const tagLabels = useMemo(() => {
    return Array.from(selectedCounts.entries())
      .filter(([_, { selected }]) => selected > 0)
      .map(([parentId, { selected, total }]) => {
        let parent = flatList.find((n) => n.value === parentId);
        while (parent && parentMap[parent.value] && selected === total) {
          const parentValue = parent.value;
          parent = flatList.find((n) => n.value === parentMap[parentValue]);
        }
        return parent
          ? {
              id: parent.value,
              label: `${parent.label} (${selected}/${total})`,
            }
          : null;
      })
      .filter(Boolean) as { id: IValue; label: string }[];
  }, [flatList, parentMap, selectedCounts]);

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
    setHiddenCount(tagLabels.length - visibleCount);
  }, [tagLabels]);

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
  }, [updateHiddenTags]);

  useEffect(() => {
    console.log({ checkedItems2 });
  }, [checkedItems2]);

  const handleToggleCheck = (item: FlatNode) => {
    const { parentId = "", value, children = [] } = item;
    const key = `${parentId}-${value}`;
    setCheckedItems2((prev) => {
      const newCheckedItems = new Map(prev);
      if (parentId) {
        if (newCheckedItems.has(key)) {
          newCheckedItems.delete(key);
        } else {
          newCheckedItems.set(key, {
            groupIds: parentId,
            childIds: value,
          });
        }
      } else {
        if (newCheckedItems.has(key)) {
          newCheckedItems.delete(key);
        } else {
          children.forEach((child) => {
            const key = `${child.parentId}-${child.value}`;
            newCheckedItems.set(key, {
              groupIds: child.parentId!,
              childIds: child.value,
            });
          });
        }
      }
      //   if (newCheckedItems.has(key)) {
      //     newCheckedItems.delete(key);
      //     if (!parentId && children) {
      //       children.forEach(({ parentId, value }) => {
      //         const key = `${parentId}-${value}`;
      //         newCheckedItems.delete(key);
      //       });
      //     }
      //   } else {
      //     newCheckedItems.set(key, {
      //       groupIds: parentId || 0,
      //       childIds: value,
      //     });
      //   }
      return newCheckedItems;
    });
  };

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = flatList[index];
    const key = `${item.parentId}-${item.value}`;
    const selectedCount = selectedCounts.get(key);
    const indeterminate =
      selectedCount &&
      selectedCount.selected > 0 &&
      selectedCount.selected !== selectedCount.total &&
      !!item.children?.length;

    const selected = checkedItems2.has(key);
    return (
      <Box
        style={style}
        sx={{
          paddingLeft: `${item.depth! * 20}px`,
          ...(item.isFirst && { borderTop: "1px solid #F2F2F2" }),
        }}
      >
        <ListItemButton
          selected={selected}
          onClick={() => {
            handleToggleCheck(item);
          }}
          style={{ minWidth: 0, paddingBlock: 0 }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#F2F2F2",
            },
          }}
        >
          <Checkbox
            checked={selected}
            readOnly
            indeterminate={indeterminate}
            indeterminateIcon={<IndeterminateCheckBoxOutlinedIcon />}
            name={`row-checkbox-${item.value}`}
            size="small"
          />
          <Typography
            noWrap
            sx={{
              flexGrow: 1,
            }}
            color={item.depth === 0 ? "primary" : "#292929"}
          >
            {item.label}
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
          {tagLabels.slice(0, 30).map(({ id, label }, index) => (
            <Chip
              key={id}
              label={label}
              deleteIcon={<CloseOutlinedIcon />}
              // onDelete={() => handleRemove(id)}
              sx={{
                borderRadius: 1.5,
                "& .MuiChip-deleteIcon": {
                  fontSize: 15,
                },
                ...(index >= tagLabels.length - hiddenCount && {
                  position: "absolute",
                  pointerEvents: "none",
                  opacity: 0,
                }),
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
          {!!anchorEl ? <ArrowDropUpIcon /> : <ArrowDropDown />}
        </IconButton>
      </Box>
      <Dropdown
        anchorEl={anchorEl}
        open={!!anchorEl}
        handleClose={handleClose}
        root={containerRef}
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
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
              }}
            />
          </Box>
          <Box sx={{ borderBottom: "1px solid #F2F2F2" }}>
            <ListItemButton
              selected={allChecked}
              // onClick={handleSelectAll}
              style={{ minWidth: 0, paddingBlock: 0 }}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "#F2F2F2",
                },
              }}
            >
              <Checkbox
                checked={allChecked}
                readOnly
                indeterminate={indeterminate}
                indeterminateIcon={<IndeterminateCheckBoxOutlinedIcon />}
                size="small"
              />
              <Typography
                noWrap
                sx={{
                  flexGrow: 1,
                }}
                color={"#292929"}
              >
                Chọn tất cả
              </Typography>
            </ListItemButton>
          </Box>
          <FixedSizeList
            width={"100%"}
            height={300}
            itemCount={flatList.length}
            itemSize={42}
          >
            {Row}
          </FixedSizeList>
        </Paper>
      </Dropdown>
    </Box>
  );
};

export default SelectTree2;
