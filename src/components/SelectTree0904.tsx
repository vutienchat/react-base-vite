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
  childrens?: IOption[];
  //   [x: string]: any;
}

interface ISelectTreeProps {
  options: IOption[];
  value?: number[];
  onChange?: (status: "DELETE" | "ADD", value: FlatNode) => void;
}

interface FlatNode extends IOption {
  depth: number;
  parentId: IValue | null;
  isFirst?: boolean;
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

const SelectTree2 = (props: ISelectTreeProps) => {
  const { value, onChange, options = [] } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const { width } = useResizeObserver(containerRef);
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [checkedItems, setCheckedItems] = useState(
    new Map<IValue, { total: number; selected: number; childIds: IValue[] }>()
  );
  const [checkedItems2, setCheckedItems2] = useState(
    new Map<IValue, IValue[]>()
  );
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

  const handleOpen = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRemove = (id: IValue, children: FlatNode[]) => {};

  const tagLabels = useMemo(() => {
    return Array.from(checkedItems.entries())
      .filter(([_, { selected }]) => selected > 0)
      .map(([parentId, { selected, total }]) => {
        const parent = flatList.find((n) => n.value === parentId);

        return parent
          ? {
              id: parent.value,
              label: `${parent.label} (${selected}/${total})`,
              children: parent.childrens,
            }
          : null;
      })
      .filter(Boolean) as { id: IValue; label: string; children: FlatNode[] }[];
  }, [flatList, checkedItems]);

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

  const handleToggleCheck = (itemChecked: FlatNode, checked: boolean) => {
    const { value, parentId, childrens } = itemChecked;

    setCheckedItems2((prev) => {
      const updated = new Map(prev);

      if (parentId) {
        const group = updated.get(parentId) || [];
        const newGroup = checked
          ? group.filter((id) => id !== value)
          : [...group, value];
        newGroup.length
          ? updated.set(parentId, newGroup)
          : updated.delete(parentId);
      } else {
        checked
          ? updated.delete(value)
          : updated.set(value, childrens?.map((item) => item.value) || []);
        // ? []
        // : childrens?.map((item) => item.value) || [];
      }

      return updated;
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

    const isParent = !item.parentId;

    let isChecked = false;
    let isIndeterminate = false;

    const checkedList = checkedItems2.get(item.parentId || item.value) || [];
    if (isParent) {
      const childIds = item.childrens?.map((child) => child.value) || [];
      isChecked = childIds.length
        ? childIds.every((id) => checkedList.includes(id))
        : checkedItems2.has(item.value);
      isIndeterminate = checkedList.length > 0 && !isChecked;
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
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
              }}
            />
          </Box>
          <Box sx={{ borderBottom: "1px solid #F2F2F2" }}>
            <ListItemButton
              // selected={allChecked}
              // onClick={handleSelectAll}
              style={{ minWidth: 0, paddingBlock: 0 }}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "#F2F2F2",
                },
              }}
            >
              <Checkbox
                // checked={allChecked}
                readOnly
                // indeterminate={!!checkedItems.size && !allChecked}
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
