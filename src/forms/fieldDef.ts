import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";

export interface SelectItem {
  value: any;
  label: string;
}

export interface FieldDef<T, S> {
  type: FieldType;
  color: "green" | "orange" | "cream" | "grey";
  name: keyof T;
  label: string;
  editable: boolean;
  placeholder?: string;
  mask?: string;
  emptyValue?: string;
  validate?: (value: string) => Validity;
  precision?: number;
  // Only for dropdown (for now)
  transformData?: (item: any) => SelectItem[];
  dataSource?: keyof S;
}
