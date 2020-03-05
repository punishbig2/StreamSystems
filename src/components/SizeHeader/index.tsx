import {SizeHeaderProps} from 'components/Run/columnData';
import React, {useState, useEffect} from 'react';
import {DualTableHeader} from 'components/dualTableHeader';

import strings from 'locales';

import {NumericInput} from 'components/NumericInput';
import {sizeFormatter} from 'utils/sizeFormatter';

type Props = SizeHeaderProps;
export const SizeHeader: React.FC<Props> = (props: Props) => {
  const [internalValue, setInternalValue] = useState<number | null>(props.value);

  const onBlur = () => {
    setInternalValue(props.value);
  };

  useEffect(() => {
    setInternalValue(props.value);
  }, [props.value]);

  const reset = () => {
    props.onReset();
  };

  const onChange = (value: string | null) => {
    if (value === '' || value === null) {
      setInternalValue(null);
    } else {
      const numeric: number = Number(value);
      if (isNaN(numeric))
        return;
      setInternalValue(numeric);
    }
  };

  const onSubmit = (input: HTMLInputElement) => {
    if (internalValue === null)
      return;
    if (internalValue >= props.minimum) {
      props.onSubmit(input, internalValue);
    }
  };

  return (
    <DualTableHeader label={strings.Size} action={
      () => (
        <div className={'header-size'}>
          <NumericInput type={'size'}
                        value={sizeFormatter(internalValue)}
                        onBlur={onBlur}
                        onChange={onChange}
                        onCancelEdit={reset}
                        onSubmit={onSubmit}/>
        </div>
      )
    }/>
  );
};
