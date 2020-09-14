import {
  Editable,
  InputHandler,
  StateReturnType,
} from "components/FormField/inputHandler";
import { MinimalProps } from "components/FormField/minimalProps";
import { Validity } from "forms/validity";
import moment from "moment";
import { DateFormatter, TimeFormatter } from "utils/timeUtils";

export class DateInputHandler<
  T,
  P extends MinimalProps,
  S extends Editable
> extends InputHandler<T, P, S> {
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
        if (value === null || value === "") {
          return ["", Validity.Intermediate];
        } else if (value instanceof Date) {
          return [DateFormatter.format(value), Validity.Valid];
        } else {
          return [value as string, Validity.InvalidFormat];
        }
      case "time":
        if (value === null || value === "") {
          return ["", Validity.Intermediate];
        } else if (value instanceof Date) {
          return [TimeFormatter.format(value), Validity.Valid];
        } else {
          return [value as string, Validity.InvalidFormat];
        }
      default:
        throw new Error("this formatter is only for date or time types");
    }
  }

  public onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    props: P,
    state: S
  ): StateReturnType<S> {
    return null;
  }

  public parse(value: string | Date): any {
    if (value instanceof Date) {
      return value;
    } else if (/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(value)) {
      const date: moment.Moment = moment(value, "MM/DD/YYYY");
      if (date.isValid()) {
        return date.toDate();
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
