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
    const children = node.children?.map((item) => ({
      ...item,
      parentId: node.value,
    }));
    result.push({ ...node, children, depth, parentId });
    if (node.children) {
      result = result.concat(flattenTree(node.children, depth + 1, node.value));
    }
  });
  return result;
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

  const [checkedItems, setCheckedItems] = useState(
    new Map<IValue, { total: number; selected: number; childIds: IValue[] }>()
  );
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

  const allChecked = useMemo(() => {
    return (
      flatList.filter(({ parentId }) => !parentId).length ===
        checkedItems.size &&
      Array.from(checkedItems.entries()).every(([, { selected, total }]) => {
        return selected === total;
      })
    );
  }, [checkedItems, flatList]);

  const handleSelectAll = () => {
    const listChilds = flatList.filter(({ parentId }) => parentId);
    if (allChecked) {
      setCheckedItems(new Map());
      listChilds.forEach((item) => {
        // console.log("change clear all", item);
        onChange?.("DELETE", item);
      });
      return;
    }
    setCheckedItems((prev) => {
      const newCounts = new Map(prev);
      listChilds.forEach((child) => {
        if (!newCounts.has(child.parentId!)) {
          newCounts.set(child.parentId!, {
            childIds: [child.value],
            selected: 1,
            total: 1,
          });
          // console.log("change  all add", child);
          onChange?.("ADD", child);
        } else {
          const dataChecked = newCounts.get(child.parentId!);
          const isExits = dataChecked?.childIds.includes(child.value);
          if (!isExits && dataChecked) {
            const { childIds } = dataChecked;
            const newChildIds = [...childIds, child.value];
            newCounts.set(child.parentId!, {
              childIds: newChildIds,
              selected: newChildIds.length,
              total: newChildIds.length,
            });
            // console.log("change  all add !isExits", child);
            onChange?.("ADD", child);
          }
        }
      });
      return newCounts;
    });
  };

  const handleOpen = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRemove = (id: IValue, children: FlatNode[]) => {
    setCheckedItems((prev) => {
      const newCheckedItems = new Map(prev);
      newCheckedItems.delete(id);
      return newCheckedItems;
    });
    children.forEach((item) => {
      // console.log("delette", item);
      onChange?.("DELETE", item);
    });
  };

  const tagLabels = useMemo(() => {
    return Array.from(checkedItems.entries())
      .filter(([_, { selected }]) => selected > 0)
      .map(([parentId, { selected, total }]) => {
        const parent = flatList.find((n) => n.value === parentId);

        return parent
          ? {
              id: parent.value,
              label: `${parent.label} (${selected}/${total})`,
              children: parent.children,
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
    console.log({ checkedItems });
  }, [checkedItems]);

  useEffect(() => {
    console.log({ checkedItems });
    setCheckedItems((prev) => {
      const newCounts = new Map(prev);
      Array.from(newCounts.entries()).forEach(
        ([key, { selected, total, childIds }]) => {
          const newTotal =
            flatList.find((option) => option.value == key)?.children?.length ||
            total;
          newCounts.set(key, {
            selected,
            total: newTotal,
            childIds,
          });
        }
      );
      return newCounts;
    });
  }, [searchText, flatList]);

  const handleToggleCheck = (itemChecked: FlatNode, checked: boolean) => {
    const { value, parentId, children = [] } = itemChecked;

    setCheckedItems((prev) => {
      const newCounts = new Map(prev);
      if (!parentId) {
        const dataItem = newCounts.get(value);
        if (checked) {
          newCounts.delete(value);
          children.forEach((item) => {
            // console.log("change delete !parentId", item);
            onChange?.("DELETE", item);
          });
        } else {
          if (dataItem) {
            const listNoChecked =
              children.filter(
                (item) => !dataItem.childIds.includes(item.value)
              ) || [];
            listNoChecked?.forEach((item) => {
              // console.log("change add !parentId", item);
              onChange?.("ADD", item);
            });
            const childIds = [
              ...dataItem.childIds,
              ...listNoChecked.map((item) => item.value),
            ];
            newCounts.set(value, {
              childIds,
              selected: childIds.length,
              total: dataItem.total,
            });
          } else {
            children.forEach((item) => {
              // console.log("change add !parentId", item);
              onChange?.("ADD", item);
            });
            const childIds = children.map((item) => item.value);
            newCounts.set(value, {
              childIds,
              selected: childIds.length,
              total: childIds.length,
            });
          }
        }
      } else {
        const dataItem = newCounts.get(parentId);
        if (dataItem) {
          if (checked) {
            const childIds = dataItem.childIds.filter((item) => item !== value);
            console.log("change delete !parentId", itemChecked);
            onChange?.("DELETE", itemChecked);
            if (childIds.length > 0) {
              newCounts.set(parentId, {
                childIds,
                selected: childIds.length,
                total: dataItem.total,
              });
            } else {
              newCounts.delete(parentId);
            }
          } else {
            const childIds = [...dataItem.childIds, value];
            newCounts.set(parentId, {
              childIds,
              selected: childIds.length,
              total: dataItem.total,
            });
            console.log("change add !parentId", itemChecked);
            onChange?.("ADD", itemChecked);
          }
        } else {
          const childrenOfParent =
            flatList.find((n) => n.value === parentId)?.children || [];
          console.log("change add ", itemChecked);
          onChange?.("ADD", itemChecked);
          newCounts.set(parentId, {
            childIds: [value],
            selected: 1,
            total: childrenOfParent.length,
          });
        }
      }

      // if (!parentId) {
      //   const childIds = checked ? children.map((item) => item.value) : [];
      //   newCounts.set(value, {
      //     total: children.length,
      //     selected: childIds.length,
      //     childIds,
      //   });
      // } else {
      //   const parentCount = newCounts.get(parentId) || {
      //     total:
      //       flatList.find((n) => n.value === parentId)?.children?.length || 0,
      //     selected: 0,
      //     childIds: [],
      //   };

      //   const updatedChildIds = checked
      //     ? [...parentCount.childIds, value]
      //     : parentCount.childIds.filter((childId) => childId !== value);

      //   newCounts.set(parentId, {
      //     ...parentCount,
      //     selected: updatedChildIds.length,
      //     childIds: updatedChildIds,
      //   });
      //   if (!checked && updatedChildIds.length === 0) {
      //     newCounts.delete(parentId);
      //   }
      // }

      // if (!checked) {
      //   newCounts.delete(value);
      // }

      return newCounts;
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
    const selectedCount = item.parentId
      ? checkedItems.get(item.parentId)
      : checkedItems.get(item.value);

    const indeterminate =
      selectedCount &&
      selectedCount.selected > 0 &&
      selectedCount.selected < selectedCount.total &&
      !!item.children?.length;

    const selected =
      selectedCount &&
      (selectedCount?.childIds.includes(item.value) ||
        selectedCount?.childIds.length === selectedCount?.total);
    return (
      <Box
        style={style}
        sx={{
          paddingLeft: `${item.depth * 20}px`,
          ...(item.isFirst && { borderTop: "1px solid #F2F2F2" }),
        }}
      >
        <ListItemButton
          selected={selected}
          onClick={() => {
            // handleToggleCheck(item, !selected);
            handleToggleCheck(item, !!selected);
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
          {!!anchorEl ? <ArrowDropUpIcon /> : <ArrowDropDown />}
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
                indeterminate={!!checkedItems.size && !allChecked}
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
