import { FieldType } from 'forms/fieldType';
import { Tenor } from 'types/tenor';

export interface MinimalProps<T = any> {
  type: FieldType;
  name: keyof T;
  editable?: boolean;
  emptyValue?: string;
  rounding?: number;
  value: string | boolean | number | Date | undefined | null | Tenor | Pick<T, keyof T>;
}
