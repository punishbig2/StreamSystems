import {SizeHeaderProps} from 'components/Run/columnData';
import React, {useState, useEffect} from 'react';
import {DualTableHeader} from 'components/dualTableHeader';

import strings from 'locales';

import {NumericInput} from 'components/NumericInput';
import {sizeFormatter} from 'utils/sizeFormatter';

type Props = SizeHeaderProps & { onSubmit: (input: HTMLInputElement) => void };
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
      if (numeric >= props.minimum)
        props.onChange(numeric);
      setInternalValue(numeric);
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
                        onSubmit={props.onSubmit}/>
        </div>
      )
    }/>
  );
};
