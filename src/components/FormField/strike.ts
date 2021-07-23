import React from "react";
import { Editable } from "components/FormField/inputHandler";
import { MinimalProps } from "components/FormField/minimalProps";
import { NumericInputHandler } from "components/FormField/numeric";
import { Validity } from "forms/validity";
import { DecimalSeparator, isNumeric } from "utils/isNumeric";

const VALID_STRIKE_REGEXP = /^[0-9]+[Dd]$|^ATM[FSZ]$/;

export class StrikeHandler<
  T,
  P extends MinimalProps,
  S extends Editable
> extends NumericInputHandler<T, P, S> {
  public format(value: any, props: P): [string, Validity] {
    if (typeof value === "undefined") return ["", Validity.Intermediate];
    if (typeof value !== "string" && typeof value !== "number") {
      return ["", Validity.Intermediate];
    } else if (value === "N/A") {
      return ["", Validity.NotApplicable];
    } else if (value === "") {
      return ["", Validity.Valid];
    } else {
      if (typeof value === "string") {
        const normalized: string = value.toUpperCase();
        const deltaOrSpecial: boolean = VALID_STRIKE_REGEXP.test(normalized);
        if (deltaOrSpecial) {
          return [normalized, Validity.Valid];
        } else if (isNumeric(normalized)) {
          if (value.endsWith(DecimalSeparator)) {
            return [value, Validity.Intermediate];
          } else {
            // Apply some formatting?
            return [normalized, Validity.Valid];
          }
        } else {
          return [normalized, Validity.InvalidValue];
        }
      } /* It's number of course */ else {
        // Apply some formatting?
        return [value.toString(), Validity.Valid];
      }
    }
  }

  public onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): Pick<S, keyof S> | S | null {
    return null;
  }

  public parse(value: string, props: P): string | number | null {
    if (/ATM[FSZ]/.test(value)) {
      return value;
    } else {
      const regex: RegExp = /^([0-9]+[dD]).*$/;
      const match: string[] | null = value.match(regex);
      if (match === null) {
        return value.replaceAll(/[.,]/g, DecimalSeparator);
      } else {
        return match[1];
      }
    }
  }

  public shouldAcceptInput(
    input: HTMLInputElement,
    props: P,
    state: S
  ): boolean {
    return true;
  }
}
