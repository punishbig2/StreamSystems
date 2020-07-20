import { Grid, MenuItem, Select } from "@material-ui/core";
import { FormField } from "components/FormField";
import { SelectItem } from "forms/fieldDef";
import moment, { isMoment } from "moment";
import React, { ReactElement } from "react";
import { SPECIFIC_TENOR } from "utils/tenorUtils";

interface Props<T> {
  data: SelectItem[];
  tenor: string;
  expiryDate: moment.Moment;
  className: string;
  readOnly: boolean;
  color: "green" | "orange" | "cream" | "grey";
  name: string;
  disabled: boolean;
  onChange?: (name: keyof T, value: any) => void;
}

export function TenorDropdown<T>(props: Props<T>): ReactElement {
  const { data } = props;
  /*useEffect(() => {
    const parsed: Date | undefined =
      typeof value === "string" ? specificTenorToDate(value) : undefined;
    if (parsed !== undefined) {
      if (onChange !== undefined) {
        onChange(name as keyof T, moment(parsed));
      }
    } else if (isMoment(value)) {
      setDate(value);
    } else if (value === "") {
      setDate(null);
    } else {
      setDate(tenorToDate(value));
    }
  }, [value, name, onChange]);*/
  const onDateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    value: moment.Moment | string
  ): void => {
    if (!isMoment(value)) return;
    if (props.onChange !== undefined) {
      props.onChange(props.name as keyof T, value);
    }
  };
  const onSelectChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    const {
      target: { value },
    } = event;
    if (props.onChange !== undefined) {
      props.onChange(props.name as keyof T, value);
    }
  };
  return (
    <Grid
      className={"MuiInputBase-root tenor-dropdown"}
      alignItems={"center"}
      container
    >
      <Grid xs={6} item>
        <Select
          value={props.tenor}
          disabled={props.disabled}
          className={props.className}
          displayEmpty={true}
          readOnly={props.readOnly}
          fullWidth={true}
          name={props.name + "-value"}
          onChange={onSelectChange}
        >
          {props.tenor === SPECIFIC_TENOR ? (
            <MenuItem value={SPECIFIC_TENOR}>{SPECIFIC_TENOR}</MenuItem>
          ) : null}
          {data.map((item: SelectItem) => (
            <MenuItem key={item.value} value={item.value}>
              {item.value}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid className={"input-container"} xs={6} item>
        <FormField<{ date: moment.Moment }>
          color={props.color}
          type={"date"}
          value={props.expiryDate}
          placeholder={"MM/DD/YYYY"}
          editable={!props.readOnly}
          name={"date"}
          onInput={onDateChange}
          disabled={props.disabled}
        />
      </Grid>
    </Grid>
  );
}
