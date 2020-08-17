import {
  FormControlLabel,
  FormHelperText,
  MenuItem,
  OutlinedInput,
  Select,
} from "@material-ui/core";
import { BankEntityField } from "components/BankEntityField";
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
import React, { PureComponent, ReactElement } from "react";

interface Props<T> extends MinimalProps<T> {
  label?: string;
  currency?: string;
  type: FieldType;
  color: "green" | "orange" | "cream" | "grey";
  disabled?: boolean;
  items?: (string | number)[];
  placeholder?: string;
  precision?: number;
  dropdownData?: SelectItem[] | any;
  handler?: InputHandler<T>;
  onChange?: (name: keyof T, value: any) => void;
  onInput?: (event: React.ChangeEvent<HTMLInputElement>, value: any) => void;
}

interface State extends Editable {
  labels: string[] | null;
  focus: boolean;
  filterValue: string;
}

const initialState: State = {
  displayValue: "",
  internalValue: "",
  labels: null,
  focus: false,
  validity: Validity.Intermediate,
  caretPosition: null,
  filterValue: "",
};

export class FormField<T> extends PureComponent<Props<T>, State> {
  private input: HTMLInputElement | null = null;
  private inputHandlers: {
    [key: string]: InputHandler<T, Props<T>, State>;
  } = {};
  private readonly defaultHandler: InputHandler<T, Props<T>, State>;

  static defaultProps = {
    precision: 0,
    emptyValue: "",
    disabled: false,
  };

  public state: State = { ...initialState };

  constructor(props: Props<T>) {
    super(props);
    const numeric: InputHandler<T, Props<T>, State> = new NumericInputHandler<
      T,
      Props<T>,
      State
    >();
    const date: InputHandler<T, Props<T>, State> = new DateInputHandler<
      T,
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
    this.defaultHandler = new DefaultHandler<T, Props<T>, State>();
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
    if (props.value !== prevProps.value) {
      this.setValueFromProps();
      // Since state will change stop right now and let the next
      // update handle anything else
      return;
    }
    if (props.dropdownData !== prevProps.dropdownData) {
      if (!(props.dropdownData instanceof Array)) return;
      this.setState({
        labels: this.extractLabelsFromData(props.dropdownData),
      });
      // Since state will change stop right now and let the next
      // update handle anything else
      return;
    }
    this.ensureCaretIsInPlace();
  };

  private setInputRef = (input: HTMLInputElement): void => {
    this.input = input;
  };

  private setValueFromProps = (): void => {
    const { props } = this;
    this.setValue(props.value);
  };

  private getHandler = (): InputHandler<T> => {
    const { props, inputHandlers } = this;
    if (props.handler) {
      return props.handler;
    }
    if (props.type in inputHandlers) {
      return inputHandlers[props.type];
    }
    return this.defaultHandler;
  };

  private setValue = (value: any): void => {
    const { props, state, input } = this;
    const handler: InputHandler<T, Props<T>, State> = this.getHandler();
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

  private parse = (value: string): any => {
    const handler: InputHandler<T, Props<T>, State> = this.getHandler();
    return handler.parse(value);
  };

  private onInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    const { props, state } = this;
    const handler: InputHandler<T, Props<T>, State> = this.getHandler();
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
      props.onChange(props.name, state.internalValue);
    }
  };

  private onInputInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { props } = this;
    if (props.onInput !== undefined) {
      const handler: InputHandler<T, Props<T>, State> = this.getHandler();
      const {
        target: { value: textValue },
      } = event;
      const value: any = handler.parse(textValue);
      props.onInput(event, value);
    }
  };

  private onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { props, state } = this;
    const {
      target: { value: inputContent },
    } = event;
    if (!props.editable) return;
    const handler: InputHandler<T, Props<T>, State> = this.getHandler();
    if (!handler.shouldAcceptInput(event.currentTarget, props, state)) {
      event.preventDefault();
    } else {
      this.saveCaretPosition(event);
      const value: any = this.parse(inputContent);
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
    props.onChange(props.name, value);
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

  private onSelectFilterClick = (event: React.MouseEvent<HTMLLIElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  private onSelectFilterKeyDown = (
    event: React.KeyboardEvent<HTMLLIElement>
  ): void => {
    switch (event.key) {
      case "Escape":
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
        break;
      default:
        event.stopPropagation();
    }
  };

  private onSelectFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { value } = event.target;
    this.setState({
      filterValue: value,
    });
  };

  private createControl = (): ReactElement | null => {
    const { props, state } = this;
    const { dropdownData } = props;
    const { value } = props;
    const classes: string[] = [
      state.validity === Validity.InvalidFormat ||
      state.validity === Validity.InvalidValue
        ? "invalid"
        : "valid",
      state.validity === Validity.NotApplicable ? "not-applicable" : "",
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
      case "bank-entity":
        if (typeof value !== "string")
          throw new Error(
            "invalid value type for bank-entity, string expected"
          );
        if (!dropdownData)
          throw new Error("cannot have a dropdown with no data");
        return (
          <BankEntityField<T>
            value={value}
            list={dropdownData}
            readOnly={!props.editable}
            name={props.name}
            onChange={props.onChange}
          />
        );
      case "tenor":
        if (!dropdownData)
          throw new Error("cannot have a dropdown with no data");
        if (value === null || value === undefined) return null;
        if (typeof value !== "object") {
          if (value === "N/A")
            return (
              <OutlinedInput
                className={[classes, "not-applicable"].join(" ")}
                value={"N/A"}
                labelWidth={0}
                readOnly={true}
              />
            );
          throw new Error("invalid type for tenor's value");
        }
        if (
          !("tenor" in (value as object)) ||
          !("expiryDate" in (value as object))
        )
          throw new Error("invalid value for tenor field");
        return (
          <TenorDropdown<T>
            tenor={(value as any).tenor}
            expiryDate={(value as any).expiryDate}
            name={props.name}
            disabled={!!props.disabled}
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
            readOnly={!props.editable}
            disabled={props.disabled}
            onChange={this.onSelectChange}
          >
            <MenuItem
              disableRipple={true}
              className={"search-item"}
              onClickCapture={this.onSelectFilterClick}
              onKeyDownCapture={this.onSelectFilterKeyDown}
            >
              <OutlinedInput
                labelWidth={0}
                value={state.filterValue}
                placeholder={"Type to filter"}
                autoFocus={true}
                onChange={this.onSelectFilterChange}
              />
            </MenuItem>
            {dropdownData
              .filter((item: { label: string }) => {
                const { label } = item;
                const { filterValue } = state;
                const lowerCaseLabel: string = label.toLowerCase();
                return lowerCaseLabel.includes(filterValue.toLowerCase());
              })
              .map((item: { label: string; value: any }) => (
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
    if (props.disabled) {
      classes.push("disabled");
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

  private content = (): ReactElement | null => {
    const { props } = this;
    const control: ReactElement | null = this.createControl();
    if (props.label === undefined) {
      return control;
    } else if (control !== null) {
      return (
        <FormControlLabel
          labelPlacement={"start"}
          label={props.label}
          control={control}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        />
      );
    } else {
      return null;
    }
  };

  public render(): ReactElement {
    return <div className={this.getClassName()}>{this.content()}</div>;
  }
}
