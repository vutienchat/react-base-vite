import React, { RefObject } from "react";
import {
  Popper,
  Grow,
  ClickAwayListener,
  PopperProps,
  Box,
} from "@mui/material";
import useResizeObserver from "./useResizeObserver";

interface DropdownProps extends Partial<PopperProps> {
  anchorEl: PopperProps["anchorEl"];
  open: boolean;
  handleClose: () => void;
  children: React.ReactNode;
  root?: RefObject<HTMLDivElement>;
}

const Dropdown: React.FC<DropdownProps> = ({
  anchorEl,
  open,
  handleClose,
  children,
  root,
  ...popperProps
}) => {
  const { width } = useResizeObserver(root);

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      transition
      placement="bottom-start"
      style={{
        width: width || "auto",
        minWidth: 200,
      }}
      {...popperProps}
    >
      {({ TransitionProps, placement }) => (
        <ClickAwayListener onClickAway={handleClose}>
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement?.startsWith("bottom")
                ? "center top"
                : "center bottom",
            }}
            timeout={250}
          >
            <Box>{children}</Box>
          </Grow>
        </ClickAwayListener>
      )}
    </Popper>
  );
};

export default Dropdown;
