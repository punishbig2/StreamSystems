import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
import { ReadOnlyField } from "components/FormField/readOnlyField";
import { DropdownItem } from "forms/fieldDef";
import moment, { isMoment } from "moment";
import React, { ReactElement } from "react";

export interface Tenor {
  tenor: string;
  expiryDate: moment.Moment;
}

interface Props<T> {
  data: DropdownItem[];
  value: Tenor;
  className?: string;
  color: "green" | "orange" | "cream" | "grey";
  name: keyof T;
  disabled: boolean;
  readOnly: boolean;
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
  const onSelectChange = (name: keyof T, value: any) => {
    if (props.onChange !== undefined) {
      props.onChange(name, value);
    }
  };
  const tenorControl = (): ReactElement => {
    if (props.readOnly) {
      return <ReadOnlyField name={props.name + "-value"} value={value.tenor} />;
    } else {
      return (
        <FormField
          dropdownData={data}
          color={props.color}
          value={value.tenor}
          name={props.name}
          type={"dropdown"}
          editable={!props.readOnly}
          disabled={props.disabled}
          onChange={onSelectChange}
        />
      );
    }
  };
  return (
    <Grid className={"MuiInputBase-root"} alignItems={"center"} container>
      <Grid className={"bank-entity-field"} spacing={1} item container>
        <Grid xs={6} item>
          {tenorControl()}
          <div style={{ width: 2 }} />
        </Grid>
        <Grid xs={6} item>
          <div style={{ width: 2 }} />
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
