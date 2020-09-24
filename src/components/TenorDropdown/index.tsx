import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
import { DropdownItem } from "forms/fieldDef";
import React, { ReactElement } from "react";
import { Tenor } from "types/tenor";

interface Props<T> {
  data: DropdownItem[];
  value: Tenor | null;
  className?: string;
  color: "green" | "orange" | "cream" | "grey";
  name: keyof T;
  disabled?: boolean;
  readOnly: boolean;
  onChange?: (name: keyof T, value: any) => Promise<void>;
}

export function TenorDropdown<T>(props: Props<T>): ReactElement {
  const { data, value } = props;
  const onDateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    value: Date | string
  ): void => {
    if (value instanceof Date) return;
    if (props.onChange !== undefined) {
      props.onChange(props.name as keyof T, value);
    }
  };
  const onSelectChange = async (name: keyof T, value: any): Promise<void> => {
    if (props.onChange !== undefined) {
      await props.onChange(name, value);
    }
  };
  const { name = "", expiryDate = null } = value !== null ? value : {};
  return (
    <Grid className={"MuiInputBase-root"} alignItems={"center"} container>
      <Grid className={"bank-entity-field"} spacing={1} item container>
        <Grid xs={6} item>
          <FormField
            dropdownData={data}
            color={props.color}
            value={name}
            name={props.name}
            type={"dropdown"}
            editable={!props.readOnly}
            disabled={props.disabled}
            onChange={onSelectChange}
          />
          <div style={{ width: 2 }} />
        </Grid>
        <Grid xs={6} item>
          <div style={{ width: 2 }} />
          <FormField<{ date: Date }>
            color={props.color}
            type={"date"}
            value={expiryDate}
            placeholder={"MM/DD/YYYY"}
            editable={!props.readOnly}
            name={"date"}
            disabled={props.disabled}
            onInput={onDateChange}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}
