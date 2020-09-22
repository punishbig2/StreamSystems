import { FormHelperText, FormLabel, OutlinedInput } from "@material-ui/core";
import { BankEntityField } from "components/BankEntityField";
import { CurrentTime } from "components/currentTime";
import { DateInputHandler } from "components/FormField/date";
import { DefaultHandler } from "components/FormField/default";
import { DropdownField } from "components/FormField/dropdownField";
import { isTenor } from "components/FormField/helpers";
import { Editable, InputHandler } from "components/FormField/inputHandler";
import { MinimalProps } from "components/FormField/minimalProps";
import { NotApplicableField } from "components/FormField/notApplicableField";
import { NumericInputHandler } from "components/FormField/numeric";
import { ReadOnlyField } from "components/FormField/readOnlyField";
import { StrikeHandler } from "components/FormField/strike";
import { TenorDropdown } from "components/TenorDropdown";
import { DropdownItem } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import React, { PureComponent, ReactElement } from "react";
import { roundToNearest } from "utils/roundToNearest";

interface Props<T, R = string> extends MinimalProps<T> {
  id?: string;
  label?: string;
  currency?: string;
  type: FieldType;
  color: "green" | "orange" | "cream" | "grey";
  disabled?: boolean;
  items?: (string | number)[];
  placeholder?: string;
  precision?: number;
  dropdownData?: DropdownItem<R>[];
  rounding?: number;
  handler?: InputHandler<T>;
  onChange?: (name: keyof T, value: any) => void;
  onInput?: (event: React.ChangeEvent<HTMLInputElement>, value: any) => void;
}

interface State extends Editable {
  focus: boolean;
  filterValue: string;
}

const initialState: State = {
  displayValue: "",
  internalValue: "",
  focus: false,
  validity: Validity.Intermediate,
  caretPosition: null,
  filterValue: "",
};

export class FormField<T> extends PureComponent<Props<T>, State> {
  private input: HTMLInputElement | null = null;
  private inputHandlers: {
    [key in FieldType]?: InputHandler<T, Props<T>, State>;
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
    >(props);
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
    this.inputHandlers["strike"] = new StrikeHandler(props);
    // The default handler
    this.defaultHandler = new DefaultHandler<T, Props<T>, State>();
  }

  public componentDidMount = (): void => {
    this.setValueFromProps();
  };

  public componentDidUpdate = (prevProps: Readonly<Props<T>>): void => {
    const { props } = this;
    if (
      props.type !== prevProps.type ||
      props.editable !== prevProps.editable ||
      props.precision !== prevProps.precision ||
      props.currency !== prevProps.currency
    ) {
      const handler: InputHandler<T, Props<T>, State> = this.getHandler();
      // Reset the formatter
      handler.reset(props);
      // Update the value
      this.setValueFromProps();
    }
    if (props.value !== prevProps.value || props.type !== prevProps.type) {
      this.setValueFromProps();
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
    const handler: InputHandler<T> | undefined = inputHandlers[props.type];
    if (handler !== undefined) {
      return handler;
    } else {
      return this.defaultHandler;
    }
  };

  private setValue = (value: any): void => {
    const { props, state, input } = this;
    // Get a handler to format the value
    const handler: InputHandler<T, Props<T>, State> = this.getHandler();
    // Create a value with appropriate formatting and an
    // internal representation of the value
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

  private parse = (value: string): any => {
    const handler: InputHandler<T, Props<T>, State> = this.getHandler();
    return handler.parse(value, this.props);
  };

  private onInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    const { props, state } = this;
    const handler: InputHandler<T, Props<T>, State> = this.getHandler();
    const result: State | Pick<State, keyof State> | null = handler.onKeyDown(
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

  private handleStrikeTypeOnBlurEvent = (): void => {
    const { props, state } = this;
    if (typeof state.internalValue === "number") {
      const [displayValue, validity] = roundToNearest(
        state.internalValue,
        props.rounding
      );
      if (validity === Validity.Valid) {
        this.setState({
          displayValue: displayValue,
          internalValue: Number(displayValue),
          validity: validity,
        });
        if (props.onChange) {
          props.onChange(props.name, displayValue);
        }
      } else {
        this.setState({
          validity: validity,
        });
        if (props.onChange) {
          props.onChange(props.name, state.internalValue);
        }
      }
    } else if (props.onChange) {
      props.onChange(props.name, state.internalValue);
    }
  };

  private onInputBlur = (): void => {
    const { props, state } = this;
    const { type } = props;
    if (type === "strike") {
      this.handleStrikeTypeOnBlurEvent();
    } else {
      if (props.onChange) {
        props.onChange(props.name, state.internalValue);
      }
    }
  };

  private onInputInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { props } = this;
    if (props.onInput !== undefined) {
      const { target } = event;
      const value: any = this.parse(target.value);
      props.onInput(event, value);
    }
  };

  private onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { props, state } = this;
    const { target } = event;
    if (!props.editable) return;
    const handler: InputHandler<T, Props<T>, State> = this.getHandler();
    if (!handler.shouldAcceptInput(event.currentTarget, props, state)) {
      event.preventDefault();
    } else {
      this.saveCaretPosition(event);
      const value: any = this.parse(target.value);
      this.setValue(value);
    }
  };

  private createDropdownField = (): ReactElement => {
    const { props, state } = this;
    if (!props.dropdownData) {
      throw new Error("cannot have a dropdown with no data");
    }
    return (
      <DropdownField<T>
        name={props.name}
        disabled={props.disabled}
        editable={props.editable}
        value={state.internalValue}
        items={props.dropdownData}
        emptyMessage={
          props.emptyValue !== undefined ? props.emptyValue : "No selection"
        }
        onChange={props.onChange}
      />
    );
  };

  private createTenorField = (): ReactElement | null => {
    const { props } = this;
    if (!props.dropdownData) {
      throw new Error("cannot have a dropdown with no data");
    }
    if (props.value !== null && !isTenor(props.value)) {
      throw new Error("invalid value for tenor field");
    }
    return (
      <TenorDropdown<T>
        value={props.value}
        name={props.name}
        disabled={props.disabled}
        color={props.color}
        readOnly={!props.editable}
        data={props.dropdownData}
        onChange={props.onChange}
      />
    );
  };

  private createBankEntityField = (): ReactElement => {
    const { props } = this;
    if (!props.dropdownData) {
      throw new Error("cannot have a dropdown with no data");
    }
    if (typeof props.value !== "string") {
      throw new Error("invalid value type for bank-entity, string expected");
    }
    return (
      <BankEntityField<T>
        color={props.color}
        name={props.name}
        value={props.value}
        list={props.dropdownData}
        readOnly={!props.editable}
        disabled={!!props.disabled}
        onChange={props.onChange}
      />
    );
  };

  private createDefaultField = (): ReactElement => {
    const { props, state } = this;
    if (!props.editable) {
      return (
        <ReadOnlyField
          name={props.name as string}
          value={state.displayValue}
          disabled={props.disabled}
        />
      );
    } else {
      return (
        <>
          <OutlinedInput
            labelWidth={0}
            readOnly={false}
            disabled={props.disabled}
            inputRef={this.setInputRef}
            value={state.displayValue}
            fullWidth={true}
            error={
              state.validity === Validity.InvalidFormat ||
              state.validity === Validity.InvalidValue
            }
            placeholder={props.placeholder}
            autoComplete={"new-password"}
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

  private createControl = (): ReactElement | null => {
    const { props } = this;
    const { value } = props;
    // Not applicable values are common to all types
    if (value === "N/A") return <NotApplicableField />;
    // Check which type it is and pick
    switch (props.type) {
      case "current:time":
        return <CurrentTime timeOnly={true} />;
      case "current:date":
        return <CurrentTime dateOnly={true} />;
      case "bank-entity":
        return this.createBankEntityField();
      case "tenor":
        return this.createTenorField();
      case "dropdown":
        return this.createDropdownField();
      default:
        return this.createDefaultField();
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

  private content = (): ReactElement | null => {
    const { props } = this;
    const control: ReactElement | null = this.createControl();
    if (props.label === undefined) {
      return control;
    } else if (control !== null) {
      return (
        <>
          <FormLabel htmlFor={props.name as string} disabled={props.disabled}>
            {props.label}
          </FormLabel>
          {control}
        </>
      );
    } else {
      return null;
    }
  };

  public render(): ReactElement {
    return <div className={this.getClassName()}>{this.content()}</div>;
  }
}
