import {Layout} from 'components/TableInput/layout';
import React, {ReactElement} from 'react';

interface Props {
  value: string | number | null;
  onChange?: (value: string) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onSubmit?: (value: string) => void;
  readOnly?: boolean;
  color: 'red' | 'blue' | 'green' | 'black' | 'gray';
  onBlur?: () => void;
  tabIndex?: number;
}

const TableInput = <T extends any = string>(props: Props): ReactElement => {
  const {onChange, onSubmit, value, ...otherProps} = props;
  const onInternalChange = (event: React.FormEvent<HTMLInputElement>) => {
    const target: HTMLInputElement = event.currentTarget;
    if (onChange !== undefined) {
      onChange(target.value);
    }
  };
  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (value === null || onSubmit === undefined)
      return;
    if (event.key === 'Enter') {
      onSubmit(value.toString());
    }
  };
  const getValue = (): string => {
    if (value === null)
      return '';
    return value.toString();
  };
  return (
    <Layout
      {...otherProps}
      onBlur={props.onBlur}
      onChange={onInternalChange}
      onKeyPress={onKeyPress}
      className={props.color}
      value={getValue()}
      tabIndex={props.tabIndex}/>
  );
};

export {TableInput};

