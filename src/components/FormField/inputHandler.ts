import { MinimalProps } from "components/FormField/minimalProps";
import { Validity } from "forms/validity";
import React from "react";

export interface Editable {
  displayValue: string;
  internalValue: any;
  caretPosition: number | null;
  validity: Validity;
}

export const getCaretPosition = (input: HTMLInputElement | null): number => {
  if (input === null || input.selectionStart === null) return 0;
  return input.selectionStart;
};

export type StateReturnType<S> = S | Pick<S, keyof S> | null;

export interface InputHandler<
  T,
  P extends MinimalProps = any,
  S extends Editable = any
> {
  onKeydown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S>;
  createValue(
    value: any,
    input: HTMLInputElement | null,
    props: P,
    state: S
  ): StateReturnType<S>;
  format(value: any, props: P): [string, Validity];
  parse(value: string): any;
  shouldAcceptInput(input: HTMLInputElement, props: P, state: S): boolean;
}
