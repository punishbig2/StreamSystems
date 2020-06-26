import moment, { Moment } from "moment";
import { FieldType } from 'forms/fieldType';

const isMoment = (value: any): value is Moment => {
  return value instanceof moment;
};


export const getValue = (
  type: FieldType,
  name: string,
  value: string | boolean | number | Moment | undefined | null,
  precision?: number,
  currency?: string,
): string | undefined => {
  if (value === null) return "";
  if (value === undefined) return undefined;
  const numberOptions = {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    style: type === "currency" ? "currency" : undefined,
    currency: type === "currency" ? currency : undefined,
  };
  switch (type) {
    case "date":
      if (isMoment(value)) {
        return value.format("MM/DD/YYYY");
      } else {
        throw new Error(
          `date value must be instance of moment.Moment: ${name}`
        );
      }
    case "time":
      if (isMoment(value)) {
        return value.format("HH:mm A");
      } else {
        throw new Error(
          `date value must be instance of moment.Moment: ${name}`
        );
      }
    case "text":
      if (typeof value === "string") {
        return value;
      } else {
        throw new Error(
          `unexpected non string value for string field: ${name}`
        );
      }
    case "number":
      if (typeof value === "number") {
        if (value < 0) {
          return `(${(-value).toLocaleString(undefined, numberOptions)})`;
        }
        return value.toLocaleString(undefined, numberOptions);
      } else {
        throw new Error(
          `unexpected non numeric value for number field: ${name}`
        );
      }
    case "currency":
      if (typeof value === "number") {
        if (value < 0) {
          return `(${(-value).toLocaleString(undefined, numberOptions)})`;
        } else {
          return value.toLocaleString(undefined, numberOptions);
        }
      } else {
        throw new Error(
          `unexpected non numeric value for currency field: ${name}`
        );
      }
    case "percent":
      if (typeof value === "number") {
        return `${value.toLocaleString(undefined, numberOptions)}%`;
      } else {
        throw new Error(
          `unexpected non numeric value for percent field: ${name}`
        );
      }
    case "dropdown":
      return "";
    case "boolean":
      return value === true ? "TRUE" : "FALSE";
    default:
      return "";
  }
};
