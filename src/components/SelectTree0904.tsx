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
import Dropdown from "./Dropdown";
import IndeterminateCheckBoxOutlinedIcon from "@mui/icons-material/IndeterminateCheckBoxOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

type IValue = number | string;
interface IOption {
  value: IValue;
  label: string;
  childrens?: IOption[];
  //   [x: string]: any;
}

interface FlatChild extends IOption {
  parentId: IValue | null;
}
interface FlatNode extends Omit<IOption, "childrens"> {
  depth: number;
  parentId: IValue | null;
  isFirst?: boolean;
  childrens?: FlatChild[];
}

interface ISelectTreeProps {
  options: IOption[];
  value?: number[];
  onChange?: (status: "DELETE" | "ADD", value: FlatNode) => void;
}

const flattenTree = (
  nodes: IOption[],
  depth = 0,
  parentId: IValue | null = null
): FlatNode[] => {
  let result: FlatNode[] = [];
  nodes.forEach((node) => {
    const childrens =
      node.childrens?.map((item) => ({
        ...item,
        parentId: node.value,
      })) || [];
    result.push({ ...node, childrens, depth, parentId });
    if (node.childrens) {
      result = result.concat(
        flattenTree(node.childrens, depth + 1, node.value)
      );
    }
  });
  return result;
};

const addIsFirstFlag = (data: IOption[]) =>
  data.map((item) => ({ ...item, isFirst: true }));

const HEIGHT_iTEM = 38;

const SelectTree2 = (props: ISelectTreeProps) => {
  const { value, onChange, options = [] } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [checkedItems, setCheckedItems] = useState(new Map<IValue, IValue[]>());

  const flatListCurrent = useMemo(() => flattenTree(options), [options]);

  const flatList = useMemo(() => {
    const result: IOption[] = [];
    options.forEach((item) => {
      if (item.label.includes(searchText)) {
        result.push(item);
      } else {
        const matchedChildren =
          item.childrens?.filter((child) => child.label.includes(searchText)) ||
          [];
        if (matchedChildren.length > 0) {
          result.push({ ...item, childrens: matchedChildren });
        }
      }
    });
    return flattenTree(addIsFirstFlag(result));
  }, [options, searchText]);

  const allChecked = useMemo(() => {
    return flatList.every((item) =>
      !item.parentId
        ? checkedItems.has(item.value)
        : checkedItems.get(item.parentId)?.includes(item.value) ?? false
    );
  }, [checkedItems, flatList]);

  const indeterminate = useMemo(() => {
    return flatList.some((item) =>
      !item.parentId
        ? checkedItems.has(item.value) && !item.childrens?.length
        : checkedItems.get(item.parentId)?.includes(item.value) ?? false
    );
  }, [checkedItems, flatList]);

  const handleOpen = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchText("");
  };

  const handleRemove = (id: IValue, children: FlatChild[]) => {
    setCheckedItems((prev) => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });
  };

  const handleToggleCheck = (itemChecked: FlatNode, checked: boolean) => {
    const { value, parentId, childrens = [] } = itemChecked;
    setCheckedItems((prev) => {
      const updated = new Map(prev);

      if (parentId) {
        const siblings = updated.get(parentId) || [];
        const newSiblings = checked
          ? siblings.filter((id) => id !== value)
          : [...siblings, value];

        newSiblings.length
          ? updated.set(parentId, newSiblings)
          : updated.delete(parentId);
      } else {
        const existing = updated.get(value) || [];
        const childrenIds = childrens.map((child) => child.value);

        if (checked) {
          const filtered = existing.filter((id) => !childrenIds.includes(id));
          filtered.length
            ? updated.set(value, filtered)
            : updated.delete(value);
        } else {
          updated.set(value, childrenIds);
        }
      }

      return updated;
    });
  };

  const handleSelectAll = () => {
    if (allChecked) {
      setCheckedItems((prev) => {
        const updated = new Map(prev);
        flatList.forEach(({ value, childrens }) => {
          const dataItem = updated.get(value);
          if (dataItem) {
            const childIds = dataItem.filter(
              (id) => !childrens?.some((child) => child.value === id)
            );
            childIds.length
              ? updated.set(value, childIds)
              : updated.delete(value);
          }
        });
        return updated;
      });
    } else {
      setCheckedItems((prev) => {
        const updated = new Map(prev);
        flatList.forEach(({ parentId, value }) => {
          if (!parentId && !updated.has(value)) {
            updated.set(value, []);
          } else {
            const dataItem = updated.get(parentId!) || [];
            if (!dataItem) {
              updated.set(parentId!, [value]);
            } else {
              const isExits = dataItem.includes(value);
              !isExits && updated.set(parentId!, [...dataItem, value]);
            }
          }
        });
        return updated;
      });
    }
  };

  const tagLabels = useMemo(() => {
    const result: {
      id: IValue;
      label: string;
      children: FlatChild[];
    }[] = [];

    checkedItems.forEach((ids, parentId) => {
      const parent = flatListCurrent.find((n) => n.value === parentId);
      if (parent) {
        const totalChildren = parent.childrens?.length ?? 0;
        result.push({
          id: parent.value,
          label: `${parent.label}${
            totalChildren ? ` (${ids.length}/${totalChildren})` : ""
          }`,
          children: parent.childrens || [],
        });
      }
    });

    return result;
  }, [flatListCurrent, checkedItems]);

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
    console.log({ checkedItems });
  }, [checkedItems]);

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = flatList[index];
    const isParent = !item.parentId;

    let isChecked = false;
    let isIndeterminate = false;

    const checkedList = checkedItems.get(item.parentId || item.value) || [];
    if (isParent) {
      const childIds = item.childrens?.map((child) => child.value) || [];
      isChecked = childIds.length
        ? childIds.every((id) => checkedList.includes(id))
        : checkedItems.has(item.value);
      isIndeterminate =
        checkedList.length > 0 &&
        childIds.some((id) => checkedList.includes(id)) &&
        !isChecked;
    } else {
      isChecked = checkedList.includes(item.value);
    }

    return (
      <Box
        style={style}
        sx={{
          paddingLeft: `${item.depth * 20}px`,
          ...(item.isFirst && { borderTop: "1px solid #F2F2F2" }),
        }}
      >
        <ListItemButton
          selected={isChecked}
          onClick={() => {
            handleToggleCheck(item, isChecked);
          }}
          style={{ minWidth: 0, paddingBlock: 0 }}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "#F2F2F2",
            },
          }}
        >
          <Checkbox
            checked={isChecked}
            readOnly
            indeterminate={!!isIndeterminate}
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
          {tagLabels.slice(0, 30).map(({ id, label, children }, index) => (
            <Chip
              key={id}
              label={label}
              deleteIcon={<CloseOutlinedIcon />}
              onDelete={() => handleRemove(id, children)}
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
          {anchorEl ? <ArrowDropUpIcon /> : <ArrowDropDown />}
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
          {flatList.length > 0 && (
            <Box sx={{ borderBottom: "1px solid #F2F2F2" }}>
              <ListItemButton
                selected={allChecked}
                onClick={handleSelectAll}
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
                  indeterminate={indeterminate && !allChecked}
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
          )}
          <FixedSizeList
            width={"100%"}
            height={Math.min(HEIGHT_iTEM * 7, HEIGHT_iTEM * flatList.length)}
            itemCount={flatList.length}
            itemSize={HEIGHT_iTEM}
          >
            {Row}
          </FixedSizeList>
        </Paper>
      </Dropdown>
    </Box>
  );
};

export default SelectTree2;
