import { InputHandler } from "components/FormField/inputHandler";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";

export interface DropdownItem {
  value: any;
  label: string;
}

export interface FieldDef<T, S = {}, E = {}> {
  type: FieldType;
  color: "green" | "orange" | "cream" | "grey";
  name: keyof T;
  label: string;
  editable: boolean | ((data: any, entry?: E) => boolean);
  placeholder?: string;
  emptyValue?: string;
  validate?: (value: string) => Validity;
  precision?: number;
  // Only for dropdown (for now)
  transformData?: (item: any, entry?: T) => DropdownItem[] | any;
  dataSource?: keyof S;
  data?: any;
  handler?: InputHandler<T>;
  key?: string;
  rounding?: number;
}
