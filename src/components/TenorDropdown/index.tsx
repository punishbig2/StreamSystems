import { Grid, MenuItem, Select } from "@material-ui/core";
import { FormField } from "components/FormField";
import { SelectItem } from "forms/fieldDef";
import moment, { isMoment } from "moment";
import React, { ReactElement } from "react";
import { SPECIFIC_TENOR } from "utils/tenorUtils";

export interface Tenor {
  tenor: string;
  expiryDate: moment.Moment;
}

interface Props<T> {
  data: SelectItem[];
  value: Tenor;
  className: string;
  readOnly: boolean;
  color: "green" | "orange" | "cream" | "grey";
  name: keyof T;
  disabled: boolean;
  onChange?: (name: keyof T, value: any) => void;
}

export function TenorDropdown<T>(props: Props<T>): ReactElement {
  const { data, value } = props;
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
    <Grid className={"MuiInputBase-root"} alignItems={"center"} container>
      <Grid className={"bank-entity-field"} item container>
        <Grid xs={6} item>
          <Select
            value={value.tenor}
            disabled={props.disabled}
            className={props.className}
            displayEmpty={true}
            readOnly={props.readOnly}
            fullWidth={true}
            name={props.name + "-value"}
            onChange={onSelectChange}
          >
            {value.tenor === SPECIFIC_TENOR ? (
              <MenuItem value={SPECIFIC_TENOR}>{SPECIFIC_TENOR}</MenuItem>
            ) : null}
            {data.map((item: SelectItem) => (
              <MenuItem key={item.value} value={item.value}>
                {item.value}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid xs={6} item>
          <FormField<{ date: moment.Moment }>
            color={props.color}
            type={"date"}
            value={value.expiryDate}
            placeholder={"MM/DD/YYYY"}
            editable={!props.readOnly}
            name={"date"}
            onInput={onDateChange}
            disabled={props.disabled}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}
