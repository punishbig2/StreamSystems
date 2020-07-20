import { Editable, InputHandler, MinimalProps, StateReturnType } from "components/FormField/inputHandler";
import { Validity } from "forms/validity";
import moment, { isMoment, Moment } from "moment";

export class DateInputHandler<T, P extends MinimalProps, S extends Editable>
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
      internalValue: value,
      validity: validity,
    } as StateReturnType<S>;
  }

  public format(value: any, props: P): [string, Validity] {
    switch (props.type) {
      case "date":
        if (value === null) {
          return ["", Validity.Intermediate];
        } else if (isMoment(value)) {
          if (value.isValid()) {
            return [value.format("MM/DD/YYYY"), Validity.Valid];
          } else {
            return ["", Validity.InvalidFormat];
          }
        } else {
          return [value as string, Validity.InvalidFormat];
        }
      case "time":
        if (isMoment(value)) {
          if (value.isValid()) {
            return [value.format("HH:mm A"), Validity.Valid];
          } else {
            return ["", Validity.InvalidValue];
          }
        } else {
          return [value as string, Validity.InvalidFormat];
        }
      default:
        throw new Error("this formatter is only for date or time types");
    }
  }

  public onKeydown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S> {
    return null;
  }

  public parse(value: string): any {
    if (isMoment(value)) {
      return value;
    } else if (/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(value)) {
      const date: Moment = moment(value, "MM/DD/YYYY");
      if (date.isValid()) {
        return date;
      } else {
        return value;
      }
    }
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
