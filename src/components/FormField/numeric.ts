import { FormattedInput } from "components/FormField/formatted";
import {
  Editable,
  getCaretPosition,
  StateReturnType,
} from "components/FormField/inputHandler";
import { MinimalProps } from "components/FormField/minimalProps";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { Globals } from "golbals";
import React from "react";
import { DecimalSeparator, toNumber } from "utils/isNumeric";
import { roundToNearest } from "utils/roundToNearest";

export interface NumericProps {
  value: any;
  precision?: number;
  type: FieldType;
  currency?: string;
  minimum?: number;
  maximum?: number;
}

const typeToStyle = (
  type: FieldType,
  editable?: boolean
): string | undefined => {
  switch (type) {
    case "percent":
      return !!editable ? "decimal" : "percent";
    case "currency":
      return "currency";
    default:
      return "decimal";
  }
};

export class NumericInputHandler<
  T,
  P extends NumericProps & MinimalProps<T>,
  S extends Editable
> extends FormattedInput<T, P, S> {
  private formatter: Intl.NumberFormat = new Intl.NumberFormat(
    Globals.locale,
    {}
  );
  private divider: number = 1;
  private minimum: number | null;
  private maximum: number | null;
  private startAdornmentString: string = "";
  private endAdornmentString: string = "";

  constructor(props: P) {
    super();
    this.formatter = this.createFormatter(props);
    this.divider = props.type === "percent" ? 100 : 1;
    this.minimum = props.minimum === undefined ? null : props.minimum;
    this.maximum = props.maximum === undefined ? null : props.maximum;
    const options = {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      useGrouping: true,
      style: typeToStyle(props.type, props.editable),
      currency: props.type === "currency" ? props.currency : undefined,
    };
    const formatter: Intl.NumberFormat = new Intl.NumberFormat(
      Globals.locale,
      options
    );
    const formatted: string = formatter.format(1);
    if (formatted.indexOf("1") > 0) {
      this.startAdornmentString = formatted.replace(/[0-9-]*/g, "");
    } else {
      this.endAdornmentString = formatted.replace(/[0-9-]*/g, "");
    }
  }

  private createFormatter(props: P): Intl.NumberFormat {
    if (props.type === "currency" && props.currency === undefined) {
      return new Intl.NumberFormat(Globals.locale, {});
    } else {
      const options = {
        maximumFractionDigits: props.precision,
        minimumFractionDigits: props.precision,
        useGrouping: true,
      };
      return new Intl.NumberFormat(Globals.locale, options);
    }
  }

  private onDecimalSeparator(
    event: React.KeyboardEvent<HTMLInputElement>,
    decimalSeparator: string,
    props: P,
    state: S
  ): Pick<S, keyof S> {
    const { displayValue } = state;
    event.preventDefault();
    // If the decimal separator is not displayed ever, we should not allow
    // the user to input it either
    if (props.precision === undefined || props.precision === 0) return state;
    // Starts the crazy stuff!
    const caretPosition: number = getCaretPosition(event.currentTarget);
    if (caretPosition >= displayValue.length - props.precision) {
      return state;
    } else if (displayValue[caretPosition] === decimalSeparator) {
      return {
        caretPosition: caretPosition + 1,
      } as Pick<S, keyof S>;
    } else {
      const integerPart: string = displayValue
        .slice(0, caretPosition)
        .replace(/[^0-9-]+/g, "");
      const decimalPart: string = displayValue
        .slice(caretPosition)
        .replace(/[^0-9-]+/g, "");
      const text: string = [integerPart, decimalPart].join(".");
      const numeric: number = Number(text);
      const [newDisplayValue, validity] = this.format(numeric, props);
      return {
        internalValue: numeric,
        displayValue: newDisplayValue,
        validity: validity,
        caretPosition: caretPosition,
      } as Pick<S, keyof S>;
    }
  }

  private isInRange(value: number): boolean {
    if (this.minimum === null && this.maximum !== null) {
      return value <= this.maximum;
    } else if (this.maximum === null && this.minimum !== null) {
      return value >= this.minimum;
    } else if (this.minimum !== null && this.maximum !== null) {
      return value >= this.minimum && value <= this.maximum;
    } else {
      return true;
    }
  }

  private onBackspace(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S> {
    const { displayValue } = state;
    const offset: number = getCaretPosition(event.currentTarget) - 1;
    if (offset < 0) {
      event.preventDefault();
    } else {
      if (displayValue[offset] === DecimalSeparator) {
        event.preventDefault();
        return {
          caretPosition: offset,
        } as StateReturnType<S>;
      } else {
        if (props.precision === undefined || props.precision === 0) return null;
        const separatorPosition: number =
          displayValue.length - props.precision - 1;
        const integerPart: string = displayValue
          .slice(0, separatorPosition)
          .replace(/[^0-9-]+/g, "");
        const decimalPart: string = displayValue.slice(separatorPosition + 1);
        if (integerPart.length === 1 && Number(decimalPart) === 0) {
          return this.createValue(null, event.currentTarget, props, state);
        } else {
          return this.createValue(
            Number([integerPart, decimalPart].join(".")) / this.divider,
            event.currentTarget,
            props,
            state
          );
        }
      }
    }
    return null;
  }

  private onM(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S> {
    event.preventDefault();
    const newState: StateReturnType<S> = this.createValue(
      1000 * state.internalValue,
      event.currentTarget,
      props,
      state
    );
    // Move the caret to the end
    if (state.caretPosition !== null) {
      return {
        ...newState,
        caretPosition: state.caretPosition + 4,
      } as StateReturnType<S>;
    } else {
      return newState;
    }
  }

  public onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S> {
    /// Reset this in order to remove it if the new character is not the
    // decimal separator
    switch (event.key) {
      case "Escape":
        return this.createValue(props.value, event.currentTarget, props, state);
      case "Backspace":
        return this.onBackspace(event, props, state);
      case "M":
      case "m":
        return this.onM(event, props, state);
      case DecimalSeparator:
        return this.onDecimalSeparator(event, DecimalSeparator, props, state);
    }
    return null;
  }

  public parse(value: string, props: P): any {
    if (value === "") return null;
    const numeric = toNumber(value, props.currency);
    if (numeric === undefined || numeric === null) return value;
    if (props.type === "percent") return numeric / this.divider;
    return numeric;
  }

  public format(value: any, props: P): [string, Validity] {
    const { formatter } = this;
    if (value === "" || value === null) {
      return ["", Validity.Intermediate];
    }
    if (typeof value === "number") {
      if (props.type === "percent") {
        if (props.editable) {
          const formatted: string = formatter.format(100 * value);
          return [formatted, Validity.Valid];
        } else {
          const formatted: string =
            value < 0
              ? `(${formatter.format(-100 * value)})`
              : formatter.format(100 * value);
          return [formatted, Validity.Valid];
        }
      }
      if (props.rounding !== undefined)
        return roundToNearest(value, props.rounding);
      const formatted: string =
        value < 0 && !props.editable
          ? `(${formatter.format(-value)})`
          : formatter.format(value);
      return [
        formatted,
        this.isInRange(value) ? Validity.Valid : Validity.InvalidValue,
      ];
    } else {
      return [value as string, Validity.InvalidFormat];
    }
  }

  public shouldAcceptInput(
    input: HTMLInputElement,
    props: P,
    state: S
  ): boolean {
    const { displayValue } = state;
    if (props.precision !== undefined && props.precision !== 0) {
      const caretPosition: number | null = getCaretPosition(input);
      if (caretPosition !== null) {
        if (
          caretPosition === displayValue.length + 1 &&
          displayValue.length !== 0
        ) {
          return false;
        }
      }
    }
    return true;
  }

  public reset(props: P) {
    super.reset(props);
    this.formatter = this.createFormatter(props);
    this.divider = props.type === "percent" ? 100 : 1;
  }

  public startAdornment(): string {
    return this.startAdornmentString;
  }

  public endAdornment(): string {
    return this.endAdornmentString;
  }
}
