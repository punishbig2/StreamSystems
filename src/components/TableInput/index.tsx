import {Layout} from 'components/TableInput/layout';
import React, {ReactElement, useEffect, useState} from 'react';

interface Props {
  value: string | number | null;
  onChange?: (value: string) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onSubmit?: (value: string) => void;
  readOnly?: boolean;
  color: 'red' | 'blue' | 'green' | 'black' | 'gray';
  tabIndex?: number;
}

const TableInput = <T extends any = string>(props: Props): ReactElement => {
  const {onChange, onSubmit, value, ...otherProps} = props;
  const [internalValue, setInternalValue] = useState<string | number | undefined | null>(value);
  const onInternalChange = (event: React.FormEvent<HTMLInputElement>) => {
    const target: HTMLInputElement = event.currentTarget;
    // Call the method with the appropriate value
    if (props.onChange !== undefined) {
      setInternalValue(target.value);
    }
  };
  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSubmit && internalValue) {
      onSubmit(internalValue.toString());
    }
  };
  useEffect(() => {
    setInternalValue(value);
  }, [value]);
  useEffect(() => {
    if (internalValue === value)
      return;
    if (!onChange)
      return;
    const timer = setTimeout(() => {
      if (internalValue) {
        onChange(internalValue.toString());
      }
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalValue]);
  return (
    <Layout
      {...otherProps}
      onChange={onInternalChange}
      onKeyPress={onKeyPress}
      className={props.color}
      value={internalValue || ''}
      tabIndex={props.tabIndex}/>
  );
};

export {TableInput};

