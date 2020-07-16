import {
  Editable,
  InputHandler,
  MinimalProps,
} from "components/FormField/inputHandler";
import { Validity } from "forms/validity";

export class StrikeHandler<P extends MinimalProps, S extends Editable>
  implements InputHandler<P, S> {
  public createValue(
    value: any,
    input: HTMLInputElement | null,
    props: P,
    state: S
  ): Pick<S, keyof S> | S | null {
    return null;
  }

  public format(value: any, props: P): [string, Validity] {
    return ["", Validity.Valid];
  }

  public onKeydown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): Pick<S, keyof S> | S | null {
    return null;
  }

  public parse(value: string): any {}

  public shouldAcceptInput(
    input: HTMLInputElement,
    props: P,
    state: S
  ): boolean {
    return false;
  }
}
