import React from 'react';
import { FormControl, FormControlLabel, OutlinedInput } from '@material-ui/core';
import moment, { Moment } from 'moment';

interface Props {
  label: string;
  name: string;
  value: string | number | Moment;
  readOnly?: boolean;
  type: 'date' | 'time' | 'text' | 'currency' | 'number' | 'percentage' | 'dropdown';
  items?: (string | number)[];
  color: 'green' | 'orange' | 'cream' | 'grey';
  precision?: number;
}

export const FormField: React.FC<Props> = (props: Props) => {
  const value: string = (() => {
    const value: string | number | Moment = props.value;
    switch (props.type) {
      case 'date':
        if (value instanceof moment) {
          // @ts-ignore
          return value.format('MM/DD/YY');
        } else {
          throw new Error(`date value must be instance of moment.Moment: ${props.name}`);
        }
      case 'time':
        if (value instanceof moment) {
          // @ts-ignore
          return value.format('HH:mm A');
        } else {
          throw new Error(`date value must be instance of moment.Moment: ${props.name}`);
        }
      case 'text':
        if (typeof value === 'string') {
          return value;
        } else {
          throw new Error(`unexpected non string value for string field: ${props.name}`);
        }
      case 'number':
        if (typeof value === 'number') {
          return value.toFixed(props.precision);
        } else {
          throw new Error(`unexpected non numeric value for number field: ${props.name}`);
        }
      case 'currency':
        if (typeof value === 'number') {
          return `$${value.toLocaleString()}`;
        } else {
          throw new Error(`unexpected non numeric value for currency field: ${props.name}`);
        }
      case 'percentage':
        if (typeof value === 'number') {
          return `$${value.toFixed(3)}%`;
        } else {
          throw new Error(`unexpected non numeric value for percentage field: ${props.name}`);
        }
      case 'dropdown':
        return '';
      default:
        return '';
    }
  })() as string;
  const control = <OutlinedInput value={value} name={props.name} readOnly={props.readOnly} labelWidth={0}/>;
  return (
    <FormControl className={props.color} margin={'none'}>
      <FormControlLabel labelPlacement={'start'} label={props.label} control={control}/>
    </FormControl>
  );
};

FormField.defaultProps = {
  precision: 0,
};
