import React, { ReactElement } from "react";
import {
  FormControl,
  FormControlLabel,
  OutlinedInput,
} from "@material-ui/core";
import { Moment } from "moment";
import { FieldType, getValue } from "components/MiddleOffice/helpers";

interface Props {
  label: string;
  name: string;
  value: string | number | Moment;
  readOnly?: boolean;
  type: FieldType;
  items?: (string | number)[];
  color: "green" | "orange" | "cream" | "grey";
  precision?: number;
}

export const FormField: React.FC<Props> = (props: Props) => {
  const value: string = getValue(
    props.type,
    props.name,
    props.value,
    props.precision
  );
  const classes: string[] = [props.color];
  if (typeof props.value === "number" && props.value < 0)
    classes.push("negative");
  const control: ReactElement = (
    <OutlinedInput
      value={value}
      name={props.name}
      readOnly={props.readOnly}
      labelWidth={0}
    />
  );
  return (
    <FormControl className={classes.join(" ")} margin={"none"}>
      <FormControlLabel
        labelPlacement={"start"}
        label={props.label}
        control={control}
      />
    </FormControl>
  );
};

FormField.defaultProps = {
  precision: 0,
};
