import React, { ReactElement, Component } from "react";
import {
  FormControl,
  FormControlLabel,
  OutlinedInput,
  Select,
  MenuItem,
} from "@material-ui/core";
import { Moment } from "moment";
import { getValue } from "components/MiddleOffice/helpers";
import { randomID } from "randomID";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { DealEntry } from "structures/dealEntry";

interface Props<T> {
  label: string;
  name: string;
  value: string | boolean | number | Moment | undefined | null;
  editable?: boolean;
  currency?: string;
  type: FieldType;
  items?: (string | number)[];
  color: "green" | "orange" | "cream" | "grey";
  placeholder?: string;
  precision?: number;
  data?: any[];
  mask?: string;
  emptyValue?: string;
  onChange?: (name: keyof T, value: any) => void;
  validate?: (value: string) => Validity;
}

export class FormField<T = DealEntry> extends Component<Props<T>> {
  static defaultProps = {
    precision: 0,
  };

  render() {
    const { props } = this;
    const value: string | undefined = getValue(
      props.type,
      props.name,
      props.value,
      props.precision,
      props.currency,
    );
    const { data } = props;
    const classes: string[] = [props.color];
    if (typeof props.value === "number" && props.value < 0) {
      classes.push("negative");
    }
    const control: ReactElement = ((): ReactElement => {
      const onInputChange = (event: any) => {
        const { value } = event.target;
        if (!props.onChange) return;
        props.onChange(props.name as keyof T, value);
      };
      const onSelectChange = (event: any) => {
        const { value } = event.target;
        if (!props.onChange) return;
        props.onChange(props.name as keyof T, value);
      };
      const mappedLabels = data
        ? data.reduce((obj: any, item: { label: string; value: string }) => {
          return { ...obj, [item.value]: item.label };
        }, {})
        : {};
      const renderSelectValue = (value: any) => {
        if (value === undefined) return " Select a " + props.label;
        return mappedLabels[value];
      };
      const validity: Validity =
        !!props.validate && !!value ? props.validate(value) : Validity.Valid;
      const classes: string[] = [
        validity !== Validity.Invalid ? "valid" : "invalid",
        props.value === undefined ? "empty" : "non-empty",
      ];
      const displayValue: string | undefined =
        value !== undefined ? value : props.emptyValue;
      if (props.type === "dropdown") {
        if (!data) throw new Error("cannot have a dropdown with no data");
        return (
          <Select
            value={props.value}
            className={classes.join(" ")}
            renderValue={renderSelectValue}
            displayEmpty={true}
            onChange={onSelectChange}
          >
            {data.map((item: { label: string; value: any }) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        );
      } else {
        if (props.mask) {
          return (
            <OutlinedInput
              name={randomID(props.name)}
              value={displayValue}
              className={classes.join(" ")}
              labelWidth={0}
              spellCheck={false}
              placeholder={props.placeholder}
              readOnly={!props.editable}
              autoComplete={"new-password"}
              onChange={onInputChange}
            />
          );
        } else {
          return (
            <OutlinedInput
              name={randomID(props.name)}
              value={displayValue}
              className={classes.join(" ")}
              placeholder={props.placeholder}
              readOnly={!props.editable}
              labelWidth={0}
              autoComplete={"new-password"}
              onChange={onInputChange}
            />
          );
        }
      }
    })();
    return (
      <FormControl className={classes.join(" ")} margin={"none"}>
        <FormControlLabel
          labelPlacement={"start"}
          label={props.label}
          control={control}
        />
      </FormControl>
    );
  }
}


