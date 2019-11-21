import {TableInput} from 'components/TableInput';
import React, {useEffect, useReducer} from 'react';

const toQuantity = (value: number | null, defaultValue: number | null): string => {
  if (value === null) {
    if (defaultValue === null)
      return '';
    return defaultValue.toFixed(0);
  }
  return value.toFixed(0);
};

interface Props {
  onChange: (id: string, value: number) => void;
  defaultValue: number;
  id: string;
  value: number | null;
}

interface State {
  value: string;
}

const reducer = (state: State, value: number): State => {
  return {...state, value: toQuantity(value, null)};
};

export const RunQuantity: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer(reducer, {value: toQuantity(props.value, props.defaultValue)});
  useEffect(() => {
    console.log(props.defaultValue);
    if (props.defaultValue === undefined || props.defaultValue === null)
      return;
    dispatch(props.defaultValue);
  }, [props.defaultValue]);
  return (
    <TableInput value={state.value} onChange={(value: string) => props.onChange(props.id, Number(value))}/>
  );
};

