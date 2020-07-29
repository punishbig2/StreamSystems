import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { Moment } from "moment";
import React from "react";

export interface Editable {
  displayValue: string;
  internalValue: any;
  caretPosition: number | null;
  validity: Validity;
}

export interface MinimalProps<T = any> {
  type: FieldType;
  name: keyof T;
  editable?: boolean;
  emptyValue?: string;
  value:
    | string
    | boolean
    | number
    | Moment
    | undefined
    | null
    | Pick<T, keyof T>;
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
