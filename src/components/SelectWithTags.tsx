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

interface TreeNode {
  id: number;
  name: string;
  children?: TreeNode[];
}

export function generateTreeData(count: number): TreeNode[] {
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
      const childrenCount = Math.floor(Math.random() * 3) + 1;
      node.children = Array.from({ length: childrenCount }, () =>
        createNode(level + 1)
      );
    }

    return node;
  }

  return Array.from({ length: Math.min(10, count) }, () => createNode(0));
}

const treeData1: TreeNode[] = generateTreeData(100);

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
  const parents: number[] = [];
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

export default function SelectWithTags({ value }: { value?: number[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const { width } = useResizeObserver(containerRef);
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCounts, setSelectedCounts] = useState(
    new Map<number, { total: number; selected: number }>()
  );
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const flatList = useMemo(() => flattenTree(treeData1), []);
  const parentMap = useMemo(() => buildParentMap(treeData1), []);

  const handleOpen = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    console.log({ checkedItems });
  };

  const updateCheckedItems = (
    id: number,
    checked: boolean,
    newChecked: Record<number, boolean>
  ) => {
    const node = flatList.find((n) => n.id === id);
    if (node?.children) {
      node.children.forEach((child) => {
        if (checked) {
          newChecked[child.id] = checked;
        } else {
          delete newChecked[child.id];
        }
      });
    }
    getParentIds(id, parentMap).forEach((parentId) => {
      const parentNode = flatList.find((n) => n.id === parentId);
      if (parentNode?.children) {
        const allChildrenChecked = parentNode.children.every(
          (child) => newChecked[child.id]
        );
        if (allChildrenChecked) {
          newChecked[parentId] = allChildrenChecked;
        } else {
          delete newChecked[parentId];
        }
      }
    });
  };

  // const updateCheckedItems = (
  //   id: number,
  //   checked: boolean,
  //   newChecked: Record<number, boolean>
  // ) => {
  //   const queue = [id];
  //   while (queue.length) {
  //     const currentId = queue.pop();
  //     if (currentId !== undefined) {
  //       newChecked[currentId] = checked;
  //       const children =
  //         flatList.find((node) => node.id === currentId)?.children || [];
  //       queue.push(...children.map((child) => child.id));
  //     }
  //   }
  //   getParentIds(id, parentMap).forEach((parentId) => {
  //     const parentNode = flatList.find((n) => n.id === parentId);
  //     if (parentNode?.children?.every((child) => newChecked[child.id])) {
  //       newChecked[parentId] = true;
  //     } else {
  //       delete newChecked[parentId];
  //     }
  //   });
  // };

  const handleRemove = (id: number) => {
    // setCheckedItems((prev) => {
    //   const newChecked = { ...prev };
    //   // updateCheckedItems(id, false, newChecked);
    //   const node = flatList.find((n) => n.id === id);

    //   if (node) {
    //     delete newChecked[node.id];

    //     if (node.children) {
    //       node.children.forEach((child) => {
    //         delete newChecked[child.id];
    //       });
    //     }

    //     getParentIds(node.id, parentMap).forEach((parentId) => {
    //       const parentNode = flatList.find((n) => n.id === parentId);
    //       if (parentNode?.children) {
    //         const allChildrenUnchecked = parentNode.children.every(
    //           (child) => !newChecked[child.id]
    //         );
    //         if (allChildrenUnchecked) {
    //           delete newChecked[parentId];
    //         }
    //       }
    //     });

    //     updateSelectedCounts(node.id, newChecked);
    //   }

    //   return newChecked;
    // });

    setCheckedItems((prev) => {
      const newChecked = { ...prev };
      delete newChecked[id];
      updateCheckedItems(id, false, newChecked);
      updateSelectedCounts(id, newChecked);
      return newChecked;
    });
  };

  const toggleCheck = (id: number, checked: boolean) => {
    // setCheckedItems((prev) => {
    //   const newChecked = { ...prev, [id]: checked };

    //   const node = flatList.find((n) => n.id === id);
    //   if (node?.children) {
    //     node.children.forEach((child) => {
    //       newChecked[child.id] = checked;
    //     });
    //   }

    //   getParentIds(id, parentMap).forEach((parentId) => {
    //     const parentNode = flatList.find((n) => n.id === parentId);
    //     if (parentNode?.children) {
    //       const allChildrenChecked = parentNode.children.every(
    //         (child) => newChecked[child.id]
    //       );
    //       newChecked[parentId] = allChildrenChecked;
    //     }
    //   });

    //   updateSelectedCounts(id, newChecked);

    //   return newChecked;
    // });

    setCheckedItems((prev) => {
      const newChecked = { ...prev, [id]: checked };
      updateCheckedItems(id, checked, newChecked);
      updateSelectedCounts(id, newChecked);
      return newChecked;
    });
  };

  const updateSelectedCounts = (
    nodeId: number,
    newChecked: Record<number, boolean>
  ) => {
    // setSelectedCounts((prev) => {
    //   const newCounts = new Map(prev);
    //   const updateNodeCount = (id: number) => {
    //     const node = flatList.find((n) => n.id === id);
    //     if (node?.children) {
    //       const total = node.children.length;
    //       const selected = node.children.filter(
    //         (child) => newChecked[child.id]
    //       ).length;
    //       if (selected) {
    //         newCounts.set(id, { total, selected });
    //       } else {
    //         newCounts.delete(id);
    //       }
    //     }
    //   };

    //   updateNodeCount(nodeId);
    //   getParentIds(nodeId, parentMap).forEach(updateNodeCount);

    //   return newCounts;
    // });

    setSelectedCounts((prev) => {
      const newCounts = new Map(prev);
      [nodeId, ...getParentIds(nodeId, parentMap)].forEach((id) => {
        const node = flatList.find((n) => n.id === id);
        if (node?.children) {
          const total = node.children.length;
          const selected = node.children.filter(
            (child) => newChecked[child.id]
          ).length;
          selected
            ? newCounts.set(id, { total, selected })
            : newCounts.delete(id);
        }
      });
      return newCounts;
    });
  };

  const tagLabels = useMemo(() => {
    return Array.from(selectedCounts.entries())
      .filter(([_, { selected }]) => selected > 0)
      .map(([parentId, { selected, total }]) => {
        let parent = flatList.find((n) => n.id === Number(parentId));
        while (parent && parentMap[parent.id] && selected === total) {
          parent = flatList.find((n) => n.id === parentMap[parent.id]);
        }
        return parent
          ? { id: parent.id, label: `${parent.name} (${selected}/${total})` }
          : null;
      })
      .filter(Boolean) as { id: number; label: string }[];
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
    if (!value) return;
    const newChecked: Record<number, boolean> = {};
    const newCounts = new Map();
    const updateNodeCount = (id: number) => {
      const node = flatList.find((n) => n.id === id);
      if (node?.children) {
        const total = node.children.length;
        const selected = node.children.filter(
          (child) => newChecked[child.id]
        ).length;
        if (selected) {
          newCounts.set(id, { total, selected });
        } else {
          newCounts.delete(id);
        }
      }
    };
    value.forEach((id) => {
      newChecked[id] = true;
      const node = flatList.find((n) => n.id === id);
      if (node?.children) {
        node.children.forEach((child) => {
          newChecked[child.id] = true;
        });
      }

      getParentIds(id, parentMap).forEach((parentId) => {
        const parentNode = flatList.find((n) => n.id === parentId);
        if (parentNode?.children) {
          const allChildrenChecked = parentNode.children.every(
            (child) => newChecked[child.id]
          );
          if (allChildrenChecked) {
            newChecked[parentId] = allChildrenChecked;
          } else {
            delete newChecked[parentId];
          }
        }
      });
      updateNodeCount(id);
      getParentIds(id, parentMap).forEach(updateNodeCount);
    });

    setCheckedItems(newChecked);
    setSelectedCounts(newCounts);

    // if (!value) return;
    // const newChecked: Record<number, boolean> = {};
    // const newCounts = new Map<number, { total: number; selected: number }>();

    // value.forEach((id) => {
    //   newChecked[id] = true;
    //   const node = flatList.find((n) => n.id === id);
    //   if (node?.children) {
    //     node.children.forEach((child) => {
    //       newChecked[child.id] = true;
    //     });
    //     newCounts.set(id, {
    //       total: node.children.length,
    //       selected: node.children.length,
    //     });
    //   }
    // });

    // setCheckedItems(newChecked);
    // setSelectedCounts(newCounts);
  }, [value]);

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = flatList[index];
    const selectedCount = selectedCounts.get(item.id);
    const indeterminate =
      selectedCount &&
      selectedCount.selected > 0 &&
      selectedCount.selected !== selectedCount.total &&
      !!item.children?.length;
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
          <Checkbox
            checked={!!checkedItems[item.id]}
            readOnly
            indeterminate={indeterminate}
            indeterminateIcon={<IndeterminateCheckBoxOutlinedIcon />}
            name={`row-checkbox-${item.id}`}
          />
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
          {tagLabels.slice(0, 30).map(({ id, label }, index) => (
            <Chip
              key={id}
              label={label}
              deleteIcon={<CloseOutlinedIcon />}
              onDelete={() => handleRemove(id)}
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
            />
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
}
