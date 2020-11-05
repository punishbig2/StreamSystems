import { InputHandler } from "components/FormField/inputHandler";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { DealEntry } from "../structures/dealEntry";

export interface DropdownItem<T = any> {
  readonly internalValue: T;
  readonly value: string | number;
  readonly label: string;
}

export enum Level {
  Deal,
  Summary,
  Leg,
}

export type EditableFilter = (
  fieldName: string,
  entry: DealEntry,
  editable: boolean,
  prefix: string,
  level?: Level
) => boolean;

export interface FieldDef<T, E = {}, S = {}> {
  readonly type: FieldType;
  readonly color: "green" | "orange" | "cream" | "grey";
  readonly name: keyof T;
  readonly label: string;
  readonly editable: boolean | EditableFilter;
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
