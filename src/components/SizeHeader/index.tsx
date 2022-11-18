import { DualTableHeader } from 'components/dualTableHeader';
import { NumericInput } from 'components/NumericInput';
import { SizeHeaderProps } from 'components/Run/columnData';
import strings from 'locales';
import React, { useEffect, useState } from 'react';
import { sizeFormatter } from 'utils/sizeFormatter';

type Props = SizeHeaderProps;
export const SizeHeader: React.FC<Props> = (props: Props) => {
  const [internalValue, setInternalValue] = useState<number | null>(props.value);

  const onBlur = (): void => {
    setInternalValue(props.value);
  };

  useEffect((): void => {
    setInternalValue(props.value);
  }, [props.value]);

  const reset = (): void => {
    props.onReset();
  };

  const onChange = (value: string | null): void => {
    if (value === '' || value === null) {
      setInternalValue(null);
    } else {
      const numeric = Number(value);
      if (isNaN(numeric)) return;
      setInternalValue(numeric);
    }
  };

  const onSubmit = (input: HTMLInputElement): void => {
    if (internalValue === null) return;
    if (internalValue >= props.minimum) {
      props.onSubmit(input, internalValue);
    }
  };

  return (
    <DualTableHeader
      label={strings.Size}
      action={() => (
        <div className="header-size">
          <NumericInput
            type="size"
            value={sizeFormatter(internalValue)}
            onBlur={onBlur}
            onChange={onChange}
            onCancelEdit={reset}
            onSubmit={onSubmit}
          />
        </div>
      )}
    />
  );
};
