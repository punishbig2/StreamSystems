import {
  Editable,
  getCaretPosition,
  InputHandler,
  MinimalProps,
  StateReturnType,
} from "components/FormField/inputHandler";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import React from "react";

export interface NumericProps {
  value: any;
  precision?: number;
  type: FieldType;
  currency?: string;
}

export class NumericInputHandler<
  P extends NumericProps & MinimalProps,
  S extends Editable
> implements InputHandler<P, S> {
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
        .replace(/[^0-9]+/g, "");
      const decimalPart: string = displayValue
        .slice(caretPosition)
        .replace(/[^0-9]+/g, "");
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
      if (displayValue[offset] === NumericInputHandler.getDecimalSeparator()) {
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
          .replace(/[^0-9]+/g, "");
        const decimalPart: string = displayValue.slice(separatorPosition + 1);
        if (integerPart.length === 1 && Number(decimalPart) === 0) {
          return this.createValue("", event.currentTarget, props, state);
        } else {
          return this.createValue(
            Number([integerPart, decimalPart].join(".")),
            event.currentTarget,
            props,
            state
          );
        }
      }
    }
    return null;
  }

  private static getDecimalSeparator = (): string => {
    return (1.1).toLocaleString(undefined)[1];
  };

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

  private static cleanNonDigits = (value: string): string => {
    const digitsOnly: string = value.replace(/[^0-9]+/g, "");
    if (digitsOnly.length === 0) return "0";
    return digitsOnly;
  };

  public onKeydown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S> {
    const decimalSeparator: string = NumericInputHandler.getDecimalSeparator();
    switch (event.key) {
      case "Escape":
        return this.createValue(props.value, event.currentTarget, props, state);
      case "Backspace":
        return this.onBackspace(event, props, state);
      case "M":
      case "m":
        return this.onM(event, props, state);
      case decimalSeparator:
        return this.onDecimalSeparator(event, decimalSeparator, props, state);
    }
    return null;
  }

  public createValue(
    value: any,
    input: HTMLInputElement | null,
    props: P,
    state: S
  ): StateReturnType<S> {
    if (value === null || value === undefined) {
      return {
        displayValue: "",
        internalValue: null,
        validity: Validity.Intermediate,
        caretPosition: 0,
      } as StateReturnType<S>;
    } else {
      const { displayValue } = state;
      const [newValue, validity] = this.format(value, props);
      const initialCount: number = this.countFormattingCharacters(displayValue);
      const finalCount: number = this.countFormattingCharacters(newValue);
      const caretPosition: number | null = getCaretPosition(input);
      // Adjust if the input has no content and it has precision defined, so
      // that we don't consider the trailing zeroes "new" characters
      const adjust: number =
        props.precision === undefined || props.precision === 0
          ? 0
          : displayValue.length === 0
          ? 1
          : 0;
      const resultingCaretPosition: number = Math.max(
        caretPosition + (finalCount - initialCount - adjust),
        caretPosition
      );
      return {
        displayValue: newValue,
        internalValue: value,
        validity: validity,
        caretPosition: resultingCaretPosition,
      } as StateReturnType<S>;
    }
  }

  private countFormattingCharacters = (display: string | null): number => {
    if (display === null || display === undefined) return 0;
    const stringified: string = display.replace(/[^0-9]+/g, "");
    return display.length - stringified.length;
  };

  public parse = (value: string): any => {
    const decimalSeparator: string = NumericInputHandler.getDecimalSeparator();
    const fragments: string[] = value.split(decimalSeparator);
    if (fragments.length === 2) {
      const integerPart: string = NumericInputHandler.cleanNonDigits(
        fragments[0]
      );
      const decimalPart: string = NumericInputHandler.cleanNonDigits(
        fragments[1]
      );
      const newString: string = [integerPart, decimalPart].join(".");
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

  public format(value: any, props: P): [string, Validity] {
    const { type, currency, precision } = props;
    if (value === "") {
      return ["", Validity.Intermediate];
    }
    const numberOptions = {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      style: type === "currency" ? "currency" : undefined,
      currency: type === "currency" ? currency : undefined,
    };
    if (typeof value === "number") {
      if (value < 0) {
        return [
          `(${(-value).toLocaleString(undefined, numberOptions)})`,
          Validity.Valid,
        ];
      }
      return [value.toLocaleString(undefined, numberOptions), Validity.Valid];
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
}
