import { InputHandler } from "components/FormField/inputHandler";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { DealEntry } from "types/dealEntry";

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
  readonly transformData?: (
    item: any,
    entry?: T
  ) => ReadonlyArray<DropdownItem>;
  readonly minimum?: number | ((store: S) => number);
  readonly maximum?: number;
  readonly dataSource?: keyof S;
  readonly data?: any;
  readonly handler?: InputHandler<T>;
  readonly key?: string;
  readonly rounding?: number;
  readonly tooltip?: (store: S) => string | null;
  readonly tooltipStyle?: "neutral" | "good" | "bad";
}
