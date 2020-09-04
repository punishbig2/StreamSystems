import { Tenor } from "components/TenorDropdown";
import { FieldType } from "forms/fieldType";
import { Moment } from "moment";

export interface MinimalProps<T = any> {
  type: FieldType;
  name: keyof T;
  editable?: boolean;
  emptyValue?: string;
  rounding?: number;
  value:
    | string
    | boolean
    | number
    | Moment
    | undefined
    | null
    | Tenor
    | Pick<T, keyof T>;
}
