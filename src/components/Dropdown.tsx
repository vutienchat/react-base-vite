import React from "react";
import {
  Popper,
  Grow,
  ClickAwayListener,
  PopperProps,
  Box,
} from "@mui/material";

interface DropdownProps extends Partial<PopperProps> {
  anchorEl: PopperProps["anchorEl"];
  open: boolean;
  handleClose: () => void;
  width?: string | number;
  children: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({
  anchorEl,
  open,
  handleClose,
  width = "auto",
  children,
  ...popperProps
}) => {
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      transition
      placement="bottom-start"
      style={{
        width,
        minWidth: 200,
      }}
      modifiers={[
        {
          name: "offset",
          options: {
            offset: [0, 10],
          },
        },
      ]}
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
