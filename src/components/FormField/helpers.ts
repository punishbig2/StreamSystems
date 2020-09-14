import { Tenor } from "types/tenor";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { Moment } from "moment";

export const getDisplayValue = <T>(
  type: FieldType,
  name: keyof T,
  value: string | boolean | number | Moment | undefined | null,
  editMode: boolean,
  emptyValue?: string
): [string, Validity] => {
  if (value === null || value === undefined || value === "") {
    if (editMode) return ["", Validity.Intermediate];
    return [emptyValue === undefined ? "" : emptyValue, Validity.Intermediate];
  }
  switch (type) {
    case "text":
      return [value as string, Validity.Valid];
    case "number":
    case "currency":
    case "percent":
      throw new Error(
        "this is not supposed to happen, numeric values have their own handler"
      );
    case "dropdown":
      return [value as string, Validity.Valid];
    case "boolean":
      return [value === true ? "TRUE" : "FALSE", Validity.Valid];
    default:
      return ["", Validity.Valid];
  }
};

export const isTenor = (value: any): value is Tenor => {
  return "name" in value && "expiryDate" in value;
};
