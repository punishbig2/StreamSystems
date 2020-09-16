import { InputHandler } from "components/FormField/inputHandler";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";

export interface DropdownItem<T = any> {
  readonly internalValue: T;
  readonly value: string | number;
  readonly label: string;
}

export interface FieldDef<T, S = {}, E = {}> {
  readonly type: FieldType;
  readonly color: "green" | "orange" | "cream" | "grey";
  readonly name: keyof T;
  readonly label: string;
  readonly editable: boolean | ((data: any, entry?: E) => boolean);
  readonly placeholder?: string;
  readonly emptyValue?: string;
  readonly validate?: (value: string) => Validity;
  readonly precision?: number;
  // Only for dropdown (for now)
  readonly transformData?: (item: any, entry?: T) => DropdownItem[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly dataSource?: keyof S;
  readonly data?: any;
  readonly handler?: InputHandler<T>;
  readonly key?: string;
  readonly rounding?: number;
}
