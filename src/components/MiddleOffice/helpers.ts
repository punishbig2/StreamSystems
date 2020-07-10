import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import moment, { Moment } from "moment";

export const getDisplayValue = (
  type: FieldType,
  name: string,
  value: string | boolean | number | Moment | undefined | null,
  editMode: boolean,
  precision?: number,
  currency?: string,
  emptyValue?: string
): [string, Validity] => {
  if (value === null || value === undefined || value === "") {
    if (editMode) return ["", Validity.Intermediate];
    return [emptyValue === undefined ? "" : emptyValue, Validity.Intermediate];
  }
  const numberOptions = {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    style: type === "currency" ? "currency" : undefined,
    currency: type === "currency" ? currency : undefined,
  };
  switch (type) {
    case "date":
      if (isMoment(value)) {
        if (value.isValid()) {
          return [value.format("MM/DD/YYYY"), Validity.Valid];
        } else {
          return ["MM/DD/YYYY", Validity.InvalidFormat];
        }
      } else {
        return [value as string, Validity.InvalidFormat];
      }
    case "time":
      if (isMoment(value)) {
        if (value.isValid()) {
          return [value.format("HH:mm A"), Validity.Valid];
        } else {
          return ["HH:mm A", Validity.InvalidValue];
        }
      } else {
        return [value as string, Validity.InvalidFormat];
      }
    case "text":
      return [value as string, Validity.Valid];
    case "currency":
      if (!numberOptions.currency) {
        return ["0", Validity.InvalidValue];
      }
    // eslint-disable-next-line no-fallthrough
    case "number":
      if (typeof value === "number") {
        if (value < 0) {
          return [
            `(${(-value).toLocaleString(undefined, numberOptions)})`,
            Validity.Valid,
          ];
        }
        return [value.toLocaleString(undefined, numberOptions), Validity.Valid];
      } else {
        return [value as string, Validity.InvalidFormat];
      }
    case "percent":
      if (typeof value === "number") {
        return [
          `${value.toLocaleString(undefined, numberOptions)}%`,
          Validity.Valid,
        ];
      } else {
        return [value as string, Validity.InvalidFormat];
      }
    case "dropdown":
      return [value as string, Validity.Valid];
    case "boolean":
      return [value === true ? "TRUE" : "FALSE", Validity.Valid];
    default:
      return ["", Validity.Valid];
  }
};

const isMoment = (value: any): value is Moment => {
  return value instanceof moment;
};
