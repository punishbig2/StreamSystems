import {
  Editable,
  InputHandler,
  StateReturnType,
} from "components/FormField/inputHandler";
import { MinimalProps } from "components/FormField/minimalProps";
import { Validity } from "forms/validity";

export class StrikeHandler<T, P extends MinimalProps, S extends Editable>
  implements InputHandler<T, P, S> {
  public createValue(
    value: any,
    input: HTMLInputElement | null,
    props: P,
    state: S
  ): StateReturnType<S> {
    const [displayValue, validity] = this.format(value, props);
    return {
      displayValue: displayValue,
      internalValue: displayValue,
      validity: validity,
    } as StateReturnType<S>;
  }

  public format(value: any, props: P): [string, Validity] {
    if (typeof value === "undefined") return ["", Validity.Intermediate];
    if (typeof value !== "string") {
      return ["", Validity.Intermediate];
    } else if (value === "N/A") {
      return ["N/A", Validity.NotApplicable];
    }
    return [value.toUpperCase(), Validity.Valid];
  }

  public onKeydown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): Pick<S, keyof S> | S | null {
    return null;
  }

  public parse(value: string): any {
    return value;
  }

  public shouldAcceptInput(
    input: HTMLInputElement,
    props: P,
    state: S
  ): boolean {
    return true;
  }
}
