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
import { CurrentTime } from "components/currentTime";
import { SelectItem } from "forms/fieldDef";

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
  validate?: (value: string) => Validity;
}

interface State {
  labels: string[] | null;
  focus: boolean;
}

export class FormField<T = DealEntry> extends Component<Props<T>, State> {
  static defaultProps = {
    precision: 0,
    emptyValue: "",
  };

  public state: State = {
    labels: null,
    focus: false,
  };

  public componentDidUpdate = (prevProps: Readonly<Props<T>>): void => {
    const { dropdownData } = this.props;
    if (dropdownData !== prevProps.dropdownData) {
      if (!(dropdownData instanceof Array)) return;
      this.setState({
        labels: this.extractLabelsFromData(dropdownData),
      });
    }
  };

  private extractLabelsFromData = (data: any) => {
    return data
      ? data.reduce((obj: any, item: { label: string; value: string }) => {
          return { ...obj, [item.value]: item.label };
        }, {})
      : {};
  };

  private parseNumber = (value: string): any => {
    const decimalSeparator: string = (0.1).toLocaleString(undefined).charAt(1);
    const fragments: string[] = value.split(decimalSeparator);
    if (fragments.length === 2) {
      const newString: string =
        fragments[0].replace(/[^0-9]+/g, "") +
        decimalSeparator +
        fragments[1].replace(/[^0-9]+/g, "");
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
      throw new Error(`value \`${value}' cannot be parsed as a number`);
    }
  };

  private getUnFormattedValue = (value: string, type: FieldType): any => {
    switch (type) {
      case "date":
        break;
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

  private onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { props } = this;
    const {
      currentTarget: { value },
    } = event;
    if (!props.onChange) return;
    console.log(value);
    const unFormattedValue: any = this.getUnFormattedValue(value, props.type);
    if (unFormattedValue === props.value)
      return;
    props.onChange(props.name as keyof T, unFormattedValue);
  };

  private onSelectChange = (event: any) => {
    const { props } = this;
    const { value } = event.target;
    if (!props.onChange) return;
    props.onChange(props.name as keyof T, value);
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

  private createControl = (value: any, editable: boolean): ReactElement => {
    const { props } = this;
    const { dropdownData } = props;

    const validity: Validity =
      !!props.validate && !!value ? props.validate(value) : Validity.Valid;
    const classes: string[] = [
      validity !== Validity.Invalid ? "valid" : "invalid",
      props.value === undefined ? "empty" : "non-empty",
      editable ? "editable" : "read-only",
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
            value={value}
            className={classes.join(" ")}
            renderValue={this.renderSelectValue}
            displayEmpty={true}
            onChange={this.onSelectChange}
            readOnly={!editable}
          >
            {dropdownData.map((item: { label: string; value: any }) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        );
      default:
        if (!editable) {
          return (
            <div
              className={[...classes, "readonly-field"].join(" ")}
              onClick={(event: React.MouseEvent<HTMLDivElement>) =>
                this.copyToClipboard(event, value)
              }
            >
              {value}
            </div>
          );
        }
        return (
          <OutlinedInput
            name={randomID(props.name)}
            value={value}
            className={classes.join(" ")}
            placeholder={props.placeholder}
            labelWidth={30}
            autoComplete={"new-password"}
            onChange={this.onInputChange}
          />
        );
    }
  };

  public render(): ReactElement {
    const { props, state } = this;
    const value: string | undefined = getValue(
      props.type,
      props.name,
      props.value,
      state.focus,
      props.precision,
      props.currency,
      props.emptyValue
    );
    const classes: string[] = [props.color];
    if (typeof props.value === "number" && props.value < 0) {
      classes.push("negative");
    }
    const control: ReactElement = this.createControl(value, !!props.editable);
    return (
      <FormControl className={classes.join(" ")} margin={"none"}>
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
