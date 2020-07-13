import { Grid, MenuItem, Select } from "@material-ui/core";
import { FormField } from "components/FormField";
import { SelectItem } from "forms/fieldDef";
import moment, { isMoment } from "moment";
import React, { ReactElement, useEffect, useState } from "react";
import { tenorToDuration } from "utils/dataGenerators";

interface Props<T> {
  data: SelectItem[];
  value: string;
  className: string;
  readOnly: boolean;
  color: "green" | "orange" | "cream" | "grey";
  name: string;
  onChange?: (name: keyof T, value: any) => void;
}

const tenorToDate = (value: string): moment.Moment => {
  const now: moment.Moment = moment();
  const duration: moment.Duration = tenorToDuration(value);
  return now.add(duration);
};

export function TenorDropdown<T>(props: Props<T>): ReactElement {
  const { data, value } = props;
  const [date, setDate] = useState<moment.Moment>(tenorToDate(value));
  useEffect(() => {
    if (isMoment(value)) {
      setDate(value);
    } else {
      setDate(tenorToDate(value));
    }
  }, [value]);
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
      <Grid xs={3} item>
        <Select
          value={isMoment(value) ? "SPECIFIC" : value}
          className={props.className}
          displayEmpty={true}
          readOnly={props.readOnly}
          fullWidth={true}
          name={props.name + "-value"}
          onChange={onSelectChange}
        >
          {isMoment(value) ? (
            <MenuItem value={"SPECIFIC"}>SPECIFIC</MenuItem>
          ) : null}
          {data.map((item: SelectItem) => (
            <MenuItem key={item.value} value={item.value}>
              {item.value}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid className={"input-container"} xs={9} item>
        <FormField<{ date: moment.Moment }>
          color={props.color}
          type={"date"}
          value={date}
          editable={!props.readOnly}
          name={"date"}
          onInput={onDateChange}
        />
      </Grid>
    </Grid>
  );
}
