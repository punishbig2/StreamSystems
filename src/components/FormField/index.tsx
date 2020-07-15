import {
  FormControlLabel,
  FormHelperText,
  MenuItem,
  OutlinedInput,
  Select,
} from "@material-ui/core";
import { CurrentTime } from "components/currentTime";
import { DateInputHandler } from "components/FormField/date";
import { DefaultHandler } from "components/FormField/default";
import {
  Editable,
  InputHandler,
  MinimalProps,
} from "components/FormField/inputHandler";
import { NumericInputHandler } from "components/FormField/numeric";
import { TenorDropdown } from "components/TenorDropdown";
import { SelectItem } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { randomID } from "randomID";
import React, { Component, ReactElement } from "react";

interface Props<T> extends MinimalProps {
  label?: string;
  currency?: string;
  type: FieldType;
  items?: (string | number)[];
  color: "green" | "orange" | "cream" | "grey";
  placeholder?: string;
  precision?: number;
  dropdownData?: SelectItem[] | any;
  onChange?: (name: keyof T, value: any) => void;
  onInput?: (event: React.ChangeEvent<HTMLInputElement>, value: any) => void;
}

interface State extends Editable {
  labels: string[] | null;
  focus: boolean;
}

const initialState: State = {
  displayValue: "",
  internalValue: "",
  labels: null,
  focus: false,
  validity: Validity.Intermediate,
  caretPosition: null,
};

export class FormField<T> extends Component<Props<T>, State> {
  private input: HTMLInputElement | null = null;
  private inputHandlers: {
    [key: string]: InputHandler<Props<T>, State>;
  } = {};
  private readonly defaultHandler: InputHandler<Props<T>, State>;

  static defaultProps = {
    precision: 0,
    emptyValue: "",
  };

  public state: State = { ...initialState };

  constructor(props: Props<T>) {
    super(props);
    const numeric: InputHandler<Props<T>, State> = new NumericInputHandler<
      Props<T>,
      State
    >();
    const date: InputHandler<Props<T>, State> = new DateInputHandler<
      Props<T>,
      State
    >();
    // Use sane handler for all numeric types
    this.inputHandlers["number"] = numeric;
    this.inputHandlers["currency"] = numeric;
    this.inputHandlers["percent"] = numeric;
    this.inputHandlers["date"] = date;
    this.inputHandlers["time"] = date;
    // The default handler
    this.defaultHandler = new DefaultHandler<Props<T>, State>();
  }

  public componentDidMount = (): void => {
    const { props } = this;
    if (props.type === "currency" && props.currency === undefined) {
      throw new Error("if type is currency you MUST specify a currency");
    }
    this.setValueFromProps();
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
      if (props.name === "vol") {
        console.log(props.value);
      }
      this.setValueFromProps();
    }
    this.ensureCaretIsInPlace();
  };

  private setInputRef = (input: HTMLInputElement) => {
    this.input = input;
  };

  private setValueFromProps = (): void => {
    const { props } = this;
    this.setValue(props.value);
  };

  private setValue = (value: any): void => {
    const { props, state, input } = this;
    const { inputHandlers } = this;
    const handler: InputHandler<Props<T>, State> =
      inputHandlers[props.type] || this.defaultHandler;
    const stateUpdate = handler.createValue(value, input, props, state);
    this.setState(stateUpdate);
  };

  private ensureCaretIsInPlace = () => {
    const { input, state } = this;
    if (input === null) return;
    // Place the caret in the right place
    if (state.caretPosition === null) return;
    input.setSelectionRange(state.caretPosition, state.caretPosition);
  };

  private extractLabelsFromData = (data: any) => {
    return data
      ? data.reduce((obj: any, item: { label: string; value: string }) => {
          return { ...obj, [item.value]: item.label };
        }, {})
      : {};
  };

  private parse = (value: string, type: FieldType): any => {
    const { inputHandlers } = this;
    const handler: InputHandler<Props<T>, State> =
      inputHandlers[type] || this.defaultHandler;
    return handler.parse(value);
  };

  private onInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    const { props, state } = this;
    const handler: InputHandler<Props<T>, State> =
      this.inputHandlers[props.type] || this.defaultHandler;
    const result: State | Pick<State, keyof State> | null = handler.onKeydown(
      event,
      props,
      state
    );
    if (result !== null) {
      this.setState(result);
    }
  };

  private saveCaretPosition = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { currentTarget } = event;
    this.setState({
      caretPosition: currentTarget.selectionStart,
    });
  };

  private onInputBlur = (/* event: React.FocusEvent<HTMLInputElement> */): void => {
    const { props, state } = this;
    if (props.onChange) {
      props.onChange(props.name as keyof T, state.internalValue);
    }
  };

  private onInputInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { props } = this;
    if (props.onInput !== undefined) {
      const { inputHandlers } = this;
      const handler: InputHandler<Props<T>, State> =
        inputHandlers[props.type] || this.defaultHandler;
      const {
        target: { value: textValue },
      } = event;
      const value: any = handler.parse(textValue);
      props.onInput(event, value);
    }
  };

  private onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { props, state, inputHandlers } = this;
    const {
      target: { value: inputContent },
    } = event;
    if (!props.editable) return;
    const handler: InputHandler<Props<T>, State> =
      inputHandlers[props.type] || this.defaultHandler;
    if (!handler.shouldAcceptInput(event.currentTarget, props, state)) {
      event.preventDefault();
    } else {
      this.saveCaretPosition(event);
      const value: any = this.parse(inputContent, props.type);
      this.setValue(value);
    }
  };

  private onSelectChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: React.ReactNode
  ) => {
    const { props } = this;
    if (!props.editable) return;
    const { value } = event.target;
    this.setValue(value);
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
      props.value === undefined && props.editable === false
        ? "empty"
        : "non-empty",
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
      case "tenor":
        if (!dropdownData)
          throw new Error("cannot have a dropdown with no data");
        return (
          <TenorDropdown<T>
            value={state.internalValue}
            name={props.name}
            color={props.color}
            className={classes.join(" ")}
            readOnly={!props.editable}
            data={dropdownData}
            onChange={props.onChange}
          />
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
              title={"Click to copy!"}
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
              inputRef={this.setInputRef}
              value={state.displayValue}
              className={classes.join(" ")}
              placeholder={props.placeholder}
              labelWidth={30}
              fullWidth={true}
              autoComplete={"new-password"}
              error={state.validity === Validity.InvalidFormat}
              onKeyDown={this.onInputKeyDown}
              onBlur={this.onInputBlur}
              onChange={this.onInputChange}
              onInput={this.onInputInput}
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
    const classes: string[] = ["field", props.color];
    if (typeof internalValue === "number" && internalValue < 0) {
      classes.push("negative");
    }
    return classes.join(" ");
  };

  private onFocus = () => {
    const caretPosition = ((): number => {
      const { input, state } = this;
      const { displayValue } = state;
      if (input === null || input.selectionStart === null)
        return displayValue.length;
      return input.selectionStart;
    })();
    this.setState({ focus: true, caretPosition: caretPosition });
  };

  private onBlur = () => {
    this.setState({ focus: false });
  };

  public render(): ReactElement {
    const { props } = this;
    const control: ReactElement = this.createControl();
    if (props.label === undefined) {
      return <div className={this.getClassName()}>{control}</div>;
    } else {
      return (
        <div className={this.getClassName()}>
          <FormControlLabel
            labelPlacement={"start"}
            label={props.label}
            control={control}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
          />
        </div>
      );
    }
  }
}
