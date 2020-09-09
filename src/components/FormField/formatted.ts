import {
  Editable,
  getCaretPosition,
  InputHandler,
  StateReturnType,
} from "components/FormField/inputHandler";
import { MinimalProps } from "components/FormField/minimalProps";
import { NumericProps } from "components/FormField/numeric";
import { Validity } from "forms/validity";
import React from "react";

export abstract class FormattedInput<
  T,
  P extends NumericProps & MinimalProps<T>,
  S extends Editable
> extends InputHandler<T, P, S> {
  public abstract parse(value: string, props: P): any;
  public abstract format(value: any, props: P): [string, Validity];
  public abstract onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S>;
  public abstract shouldAcceptInput(
    input: HTMLInputElement,
    props: P,
    state: S
  ): boolean;

  private countFormattingCharacters = (display: string | null): number => {
    if (display === null || display === undefined) return 0;
    try {
      const stringified: string = display.replace(/[^0-9]+/g, "");
      return display.length - stringified.length;
    } catch (error) {
      return 0;
    }
  };

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
    } else if (value === "N/A") {
      return {
        displayValue: "N/A",
        internalValue: "N/A",
        validity: Validity.NotApplicable,
        caretPosition: 0,
      } as StateReturnType<S>;
    } else {
      const { displayValue } = state;
      const [formattedValue, validity] = this.format(value, props);
      const initialCount: number = this.countFormattingCharacters(displayValue);
      const finalCount: number = this.countFormattingCharacters(formattedValue);
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
        displayValue: formattedValue,
        internalValue: value,
        validity: validity,
        caretPosition: resultingCaretPosition,
      } as StateReturnType<S>;
    }
  }
}
