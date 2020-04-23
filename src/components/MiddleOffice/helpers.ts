import moment, { Moment } from 'moment';

const isMoment = (value: any): value is Moment => {
  return value instanceof moment;
};

export type FieldType = 'date' | 'time' | 'text' | 'currency' | 'number' | 'percentage' | 'dropdown';
export const getValue = (type: FieldType, name: string, value: string | number | Moment, precision?: number): string => {
  switch (type) {
    case 'date':
      if (isMoment(value)) {
        return value.format('MM/DD/YYYY');
      } else {
        throw new Error(`date value must be instance of moment.Moment: ${name}`);
      }
    case 'time':
      if (isMoment(value)) {
        return value.format('HH:mm A');
      } else {
        throw new Error(`date value must be instance of moment.Moment: ${name}`);
      }
    case 'text':
      if (typeof value === 'string') {
        return value;
      } else {
        throw new Error(`unexpected non string value for string field: ${name}`);
      }
    case 'number':
      if (typeof value === 'number') {
        return value.toFixed(precision);
      } else {
        throw new Error(`unexpected non numeric value for number field: ${name}`);
      }
    case 'currency':
      if (typeof value === 'number') {
        if (value < 0) {
          return `($${(-value).toLocaleString()})`;
        } else {
          return `$${value.toLocaleString()}`;
        }
      } else {
        throw new Error(`unexpected non numeric value for currency field: ${name}`);
      }
    case 'percentage':
      if (typeof value === 'number') {
        return `${value.toFixed(3)}%`;
      } else {
        throw new Error(`unexpected non numeric value for percentage field: ${name}`);
      }
    case 'dropdown':
      return '';
    default:
      return '';
  }
};
