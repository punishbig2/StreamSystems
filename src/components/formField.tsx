import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  OutlinedInput,
  Select,
} from "@material-ui/core";
import { CurrentTime } from "components/currentTime";
import { getDisplayValue } from "components/MiddleOffice/helpers";
import { SelectItem } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { isMoment, Moment } from "moment";
import { randomID } from "randomID";
import React, { Component, ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import moment from "moment";

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
  dropdownData?: SelectItem[] | any;
  emptyValue?: string;
  onChange?: (name: keyof T, value: any) => void;
}

interface State {
  labels: string[] | null;
  internalValue: any;
  displayValue: string;
  focus: boolean;
  validity: Validity;
}

export class FormField<T> extends Component<Props<T>, State> {
  static defaultProps = {
    precision: 0,
    emptyValue: "",
  };

  public state: State = {
    displayValue: "",
    internalValue: "",
    labels: null,
    focus: false,
    validity: Validity.Intermediate,
  };

  private resetValue = (): void => {
    const { props } = this;
    this.setCurrentValue(props.value);
  };

  private setCurrentValue = (value: any): void => {
    const { props, state } = this;
    const [displayValue, validity] = getDisplayValue(
      props.type,
      props.name,
      value,
      state.focus,
      props.precision,
      props.currency,
      props.emptyValue
    );
    this.setState(
      {
        displayValue: displayValue,
        internalValue: value,
        validity: validity,
      },
      () => {}
    );
  };

  public componentDidMount = (): void => {
    this.resetValue();
  };

  public componentDidUpdate = (prevProps: Readonly<Props<T>>): void => {
    const { props } = this;
    if (props.dropdownData !== prevProps.dropdownData) {
      if (!(props.dropdownData instanceof Array)) return;
      this.setState({
        labels: this.extractLabelsFromData(props.dropdownData),
      });
    }
    if (props.value !== prevProps.value) {
      this.resetValue();
    }
  };

  private extractLabelsFromData = (data: any) => {
    return data
      ? data.reduce((obj: any, item: { label: string; value: string }) => {
          return { ...obj, [item.value]: item.label };
        }, {})
      : {};
  };

  private cleanNonDigits = (value: string): string => {
    const digitsOnly: string = value.replace(/[^0-9]+/g, "");
    if (digitsOnly.length === 0) return "0";
    return digitsOnly;
  };

  private parseNumber = (value: string): any => {
    const decimalSeparator: string = (0.1).toLocaleString(undefined).charAt(1);
    const fragments: string[] = value.split(decimalSeparator);
    if (fragments.length === 2) {
      const integerPart: string = this.cleanNonDigits(fragments[0]);
      const decimalPart: string = this.cleanNonDigits(fragments[1]);
      const newString: string = integerPart + decimalSeparator + decimalPart;
      if (newString.length === 0) {
        return "";
      } else {
        return Number(newString);
      }
    } else if (fragments.length === 1) {
      const newString = fragments[0].replace(/[^0-9]+/g, "");
      if (newString.length === 0) {
        return "";
      } else {
        return Number(newString);
      }
    } else {
      return value;
    }
  };

  private getUnFormattedValue = (value: string, type: FieldType): any => {
    switch (type) {
      case "date":
        if (isMoment(value)) {
          return value;
        } else if (/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(value)) {
          const date: moment.Moment = moment(value, "MM/DD/YYYY");
          if (date.isValid()) {
            return date;
          } else {
            return value;
          }
        }
        return value;
      case "time":
        break;
      case "text":
        return value;
      case "currency":
      case "number":
      case "percent":
        return this.parseNumber(value);
      case "dropdown":
        break;
      case "boolean":
        break;
      case "current:date":
        break;
      case "current:time":
        break;
    }
    return null;
  };

  private onInputKeyUp = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    const { props, state } = this;
    switch (event.key) {
      case "Escape":
        this.resetValue();
        break;
      case "Enter":
        if (props.onChange) {
          props.onChange(props.name as keyof T, state.internalValue);
        }
        break;
    }
  };

  private onInputBlur = (/* event: React.FocusEvent<HTMLInputElement> */): void => {
    const { props, state } = this;
    if (props.onChange) {
      props.onChange(props.name as keyof T, state.internalValue);
    }
  };

  private onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { props } = this;
    const {
      currentTarget: { value },
    } = event;
    if (!props.editable) return;
    const unFormattedValue: any = this.getUnFormattedValue(value, props.type);
    if (unFormattedValue === props.value) return;
    // props.onChange(props.name as keyof T, unFormattedValue);
    this.setCurrentValue(unFormattedValue);
  };

  private onSelectChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: React.ReactNode
  ) => {
    const { props } = this;
    if (!props.editable) return;
    const { value } = event.target;
    this.setCurrentValue(value);
    // In this case, propagation of the change has to occur instantly
    if (!props.onChange) return;
    props.onChange(props.name as keyof T, value);
    // Child is unused
    void child;
  };

  private renderSelectValue = (value: any) => {
    const { props, state } = this;
    const { labels } = state;
    if (value === undefined) return " Select a " + props.label;
    if (labels === null) return "Error";
    return labels[value];
  };

  private copyToClipboard = (
    event: React.MouseEvent<HTMLDivElement>,
    value: string
  ) => {
    const input: HTMLInputElement = document.createElement("input");
    const { body } = document;
    const { style } = input;
    // Make it invisible
    style.position = "absolute";
    style.top = "-1";
    style.left = "-1";
    style.height = "1";
    style.width = "1";
    // Flash it ...
    const target: HTMLDivElement = event.target as HTMLDivElement;
    const html: string = target.innerHTML;
    target.innerHTML = "Copied...";
    setTimeout(() => {
      target.innerHTML = html;
    }, 600);
    // Attach it
    body.appendChild(input);
    input.value = value;
    input.select();
    document.execCommand("copy");
    body.removeChild(input);
  };

  private createControl = (): ReactElement => {
    const { props, state } = this;
    const { dropdownData } = props;

    const classes: string[] = [
      state.validity !== Validity.InvalidFormat ? "valid" : "invalid",
      props.value === undefined ? "empty" : "non-empty",
      props.editable ? "editable" : "read-only",
    ];
    switch (props.type) {
      case "current:time":
        return (
          <div className={"readonly-field"}>
            <CurrentTime timeOnly={true} />
          </div>
        );
      case "current:date":
        return (
          <div className={"readonly-field"}>
            <CurrentTime dateOnly={true} />
          </div>
        );
      case "dropdown":
        if (!dropdownData)
          throw new Error("cannot have a dropdown with no data");
        return (
          <Select
            value={state.internalValue}
            className={classes.join(" ")}
            renderValue={this.renderSelectValue}
            displayEmpty={true}
            onChange={this.onSelectChange}
            readOnly={!props.editable}
          >
            {dropdownData.map((item: { label: string; value: any }) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        );
      default:
        if (!props.editable) {
          return (
            <div
              className={[...classes, "readonly-field"].join(" ")}
              onClick={(event: React.MouseEvent<HTMLDivElement>) =>
                this.copyToClipboard(event, state.displayValue)
              }
            >
              {state.displayValue}
            </div>
          );
        }
        return (
          <>
            <OutlinedInput
              name={randomID(props.name)}
              value={state.displayValue}
              className={classes.join(" ")}
              placeholder={props.placeholder}
              labelWidth={30}
              autoComplete={"new-password"}
              error={state.validity === Validity.InvalidFormat}
              onKeyDown={this.onInputKeyUp}
              onBlur={this.onInputBlur}
              onChange={this.onInputChange}
            />
            <FormHelperText error={state.validity === Validity.InvalidFormat}>
              {}
            </FormHelperText>
          </>
        );
    }
  };

  private getClassName = (): string => {
    const { props, state } = this;
    const { internalValue } = state;
    const classes: string[] = [props.color];
    if (typeof internalValue === "number" && internalValue < 0) {
      classes.push("negative");
    }
    return classes.join(" ");
  };

  public render(): ReactElement {
    const { props } = this;
    const control: ReactElement = this.createControl();
    return (
      <FormControl className={this.getClassName()} margin={"none"}>
        <FormControlLabel
          labelPlacement={"start"}
          label={props.label}
          control={control}
          onFocus={() => this.setState({ focus: true })}
          onBlur={() => this.setState({ focus: false })}
        />
      </FormControl>
    );
  }
}
