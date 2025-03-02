import { ReactNode, useMemo, useState } from "react";
import { Search } from "@mui/icons-material";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import type { SelectProps } from "@mui/material/Select";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import Select from "@mui/material/Select";
import type { FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";

interface Props<O extends FieldValues, V extends string | number>
  extends Omit<
    SelectProps<V>,
    "name" | "renderValue" | "onSelect" | "value" | "multiple"
  > {
  name: string;
  options: O[];
  renderLabel?: (option: O) => ReactNode;
  renderValue?: (option: O) => ReactNode;
  onFilter?: (option: O[], searchValue: string) => O[];
  getOptionDisabled?: (option: O) => boolean;
  onSelect?: (value: V) => void;
  placeholder: string;
  heightOption?: number;
}

const CustomAutocomplete = <
  O extends FieldValues & { value: V; label: string },
  V extends string | number
>(
  props: Props<O, V>
) => {
  const {
    name,
    label,
    options,
    renderLabel = (option) => option.label,
    renderValue = (option) => option.label,
    disabled,
    placeholder,
    getOptionDisabled,
    onSelect,
    required,
    sx,
    heightOption = 36,
    onFilter,
    ...rest
  } = props;

  const { control } = useFormContext();

  const {
    field: { value, onChange, ...others },
    fieldState: { error },
  } = useController({ name, control });
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
  };

  const optionsBySearch = useMemo(() => {
    if (onFilter) return onFilter?.(options, searchValue);

    return options.filter((option) =>
      option.label
        .toLocaleLowerCase()
        .includes(searchValue.trim().toLocaleLowerCase())
    );
  }, [options, searchValue, onFilter]);

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id={name}>{label}</InputLabel>
      <Select
        labelId={name}
        id={name}
        value={value || ""}
        renderValue={(value) => {
          const selectedOption = options.find(
            (option) => option.value === value
          );
          if (!selectedOption) return null;
          return renderValue(selectedOption);
        }}
        label={label}
        required={required}
        size="small"
        // endAdornment={
        //   <InputAdornment position="end">
        //     <CancelIcon />
        //   </InputAdornment>
        // }
        sx={{
          "& .MuiSelect-select span::before": {
            content: `'${placeholder}'`,
            color: "#A1A1A1",
          },
          ...sx,
        }}
        {...others}
        {...rest}
      >
        <Box sx={{ px: 1, pt: 1, pb: "10px" }}>
          <TextField
            variant="outlined"
            fullWidth
            value={searchValue}
            InputProps={{
              style: { height: 40 },
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            onClick={(e) => e.stopPropagation()}
            onChange={handleSearch}
          />
        </Box>
        <Box sx={{ maxHeight: heightOption * 6, overflowY: "auto" }}>
          {optionsBySearch.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={getOptionDisabled?.(option)}
              onClick={() => {
                onChange(option.value);
                onSelect?.(option.value as V);
              }}
            >
              {renderLabel(option)}
            </MenuItem>
          ))}
        </Box>
      </Select>
      {error?.message && (
        <FormHelperText variant="outlined">{error.message}</FormHelperText>
      )}
    </FormControl>
  );
};

export default CustomAutocomplete;
