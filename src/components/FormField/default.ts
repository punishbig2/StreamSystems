import { getDisplayValue } from "components/FormField/helpers";
import {
  Editable,
  InputHandler,
  StateReturnType,
} from "components/FormField/inputHandler";
import { MinimalProps } from "components/FormField/minimalProps";
import { Validity } from "forms/validity";

export class DefaultHandler<T, P extends MinimalProps<T>, S extends Editable>
  implements InputHandler<T, P, S> {
  public createValue(
    value: any,
    input: HTMLInputElement | null,
    props: P,
    state: S
  ): StateReturnType<S> {
    const [displayValue, validity] = this.format(value, props);
    return {
      internalValue: value,
      displayValue: displayValue,
      validity: validity,
    } as StateReturnType<S>;
  }

  public onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S> {
    if (event.key === "Escape") {
      return this.createValue(props.value, event.currentTarget, props, state);
    } else {
      return null;
    }
  }

  public format<T>(value: any, props: P): [string, Validity] {
    return getDisplayValue(
      props.type,
      props.name,
      value,
      !!props.editable,
      props.emptyValue
    );
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
