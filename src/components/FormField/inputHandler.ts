import { MinimalProps } from 'components/FormField/minimalProps';
import { Validity } from 'forms/validity';
import React from 'react';

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

export abstract class InputHandler<_T, P extends MinimalProps = any, S extends Editable = any> {
  public abstract onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S>;

  public abstract createValue(
    value: any,
    input: HTMLInputElement | null,
    props: P,
    state: S
  ): StateReturnType<S>;

  public abstract format(value: any, props: P): [string, Validity];

  public abstract parse(value: string, props: P): any;

  public abstract shouldAcceptInput(input: HTMLInputElement, props: P, state: S): boolean;

  public reset(_props: P): void {
    return;
  }

  public startAdornment(_props: P): string {
    return '';
  }

  public endAdornment(_props: P): string {
    return '';
  }
}
