import { Editable } from "components/FormField/inputHandler";
import { MinimalProps } from "components/FormField/minimalProps";
import { NumericInputHandler } from "components/FormField/numeric";
import { Validity } from "forms/validity";
import { DecimalSeparator, isNumeric } from "utils/isNumeric";

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
      return ["N/A", Validity.NotApplicable];
    } else if (value === "") {
      return ["", Validity.Intermediate];
    } else {
      if (typeof value === "string") {
        const normalized: string = value.toUpperCase();
        const deltaOrSpecial: boolean = /^[0-9]+[Dd]$|^ATM[FS]$/.test(
          normalized
        );
        if (deltaOrSpecial) {
          return [normalized, Validity.Valid];
        } else if (isNumeric(normalized)) {
          if (normalized.slice(-1) === DecimalSeparator) {
            return [normalized, Validity.Intermediate];
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

  public parse(value: string): any {
    if (value === "ATMF" || value === "ATMS") {
      return value;
    } else {
      const regex: RegExp = /([0-9]+[dD]).*/;
      const match: string[] | null = value.match(regex);
      if (match === null) {
        if (isNumeric(value)) {
          if (value.endsWith(DecimalSeparator)) return value;
          return super.parse(value);
        } else {
          return value;
        }
      }
      return match[1];
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
