import React, { useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Dropdown from "./Dropdown";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const StyledDatePickerWrapper = styled("div")(({ theme }) => ({
  "& .react-datepicker": {
    border: "none",
  },
  "& .react-datepicker__header": {
    border: "none",
    backgroundColor: "transparent",
  },
  "& .react-datepicker__month": {
    margin: 0,
  },
}));

const DateRangePicker: React.FC = () => {
  const inputRef = useRef<HTMLDivElement | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (
    event: React.MouseEvent<SVGSVGElement | HTMLDivElement>
  ) => {
    setAnchorEl(inputRef.current);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <TextField
        variant="outlined"
        size="small"
        value={""}
        ref={inputRef}
        onClick={handleClick}
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CalendarTodayIcon
                style={{ cursor: "pointer" }}
                onClick={handleClick}
              />
            </InputAdornment>
          ),
        }}
      />
      <Dropdown anchorEl={anchorEl} open={!!anchorEl} handleClose={handleClose}>
        <Paper sx={{ p: 1 }}>
          <Box display="flex" gap={2.5}>
            <StyledDatePickerWrapper>
              <Typography align="center">Ngày bắt đầu</Typography>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                inline
                renderCustomHeader={({
                  decreaseMonth,
                  increaseMonth,
                  monthDate,
                }) => (
                  <Box display="flex" flexDirection="column">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <IconButton
                        onClick={decreaseMonth}
                        size="small"
                        color="primary"
                      >
                        <KeyboardArrowLeftIcon />
                      </IconButton>
                      <Typography component="span">
                        {monthDate.toLocaleString("vi-VN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Typography>
                      <IconButton
                        onClick={increaseMonth}
                        size="small"
                        color="primary"
                      >
                        <KeyboardArrowRightIcon />
                      </IconButton>
                    </Box>
                    <TextField
                      value="22/10/2025"
                      size="small"
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        pointerEvents: "none",
                      }}
                    />
                  </Box>
                )}
              />
            </StyledDatePickerWrapper>
            <StyledDatePickerWrapper>
              <Typography align="center">Ngày kết thúc</Typography>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                inline
                minDate={new Date()}
                openToDate={new Date(new Date().setMonth(3))}
                renderCustomHeader={({
                  decreaseMonth,
                  increaseMonth,
                  monthDate,
                }) => (
                  <Box display="flex" flexDirection="column">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <IconButton
                        onClick={decreaseMonth}
                        size="small"
                        color="primary"
                      >
                        <KeyboardArrowLeftIcon />
                      </IconButton>
                      <Typography component="span">
                        {monthDate.toLocaleString("vi-VN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Typography>
                      <IconButton
                        onClick={increaseMonth}
                        size="small"
                        color="primary"
                      >
                        <KeyboardArrowRightIcon />
                      </IconButton>
                    </Box>
                    <TextField
                      value="22/11/2025"
                      size="small"
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                        tabIndex: -1,
                      }}
                      sx={{
                        pointerEvents: "none",
                      }}
                    />
                  </Box>
                )}
              />
            </StyledDatePickerWrapper>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap="2px">
              <Typography>22/10/2025</Typography>
              <ArrowForwardIcon fontSize="inherit" />
              <Typography>22/10/2025</Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button variant="outlined">Đặt lại</Button>
              <Button variant="contained">Chọn</Button>
            </Box>
          </Box>
        </Paper>
      </Dropdown>
    </div>
  );
};

export default DateRangePicker;
