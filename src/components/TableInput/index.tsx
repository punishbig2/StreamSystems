import {Layout} from 'components/TableInput/layout';
import React, {ReactElement, useEffect, useState} from 'react';

interface Props {
  className?: string;
  value: string;
  onChange?: (value: string) => void;
  aligned?: 'left' | 'right' | 'center';
  onDoubleClick?: (event: React.MouseEvent) => void;
  onSubmit?: (value: string) => void;
  readOnly?: boolean;
}

const TableInput = <T extends any = string>(props: Props): ReactElement => {
  const {onChange, onSubmit, value, ...otherProps} = props;
  const [internalValue, setInternalValue] = useState<string | undefined>(value);
  const onInternalChange = (event: React.FormEvent<HTMLInputElement>) => {
    const target: HTMLInputElement = event.currentTarget;
    // Call the method with the appropriate value
    if (props.onChange !== undefined) {
      setInternalValue(target.value);
    }
  };
  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSubmit && internalValue) {
      onSubmit(internalValue);
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
        onChange(internalValue);
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
      value={internalValue || ''}/>
  );
};

export {TableInput};

