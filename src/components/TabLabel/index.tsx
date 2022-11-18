import workareaStore from 'mobx/stores/workareaStore';
import React, { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

interface Props {
  readonly label: string;
  readonly isDefault: boolean;
  readonly onRenamed: (name: string) => void;
  readonly onClosed: (event: React.MouseEvent) => void;
}

export const TabLabel: React.FC<Props> = (props: Props) => {
  const ref: React.Ref<HTMLInputElement> = useRef<HTMLInputElement>(null);
  const [editable, setEditable] = useState(false);
  const { label, isDefault } = props;
  const [value, setValue] = useState<string | null>(null);

  const getLabel = (): string => {
    const finalLabel: string = value === null ? (label !== '' ? label : 'Untitled') : value;
    if (isDefault && value === null) {
      return `${finalLabel}`;
    } else {
      return finalLabel;
    }
  };

  useEffect((): void => {
    if (ref.current === null || !editable) {
      return;
    }

    const input: HTMLInputElement = ref.current;
    input.select();
  }, [ref, editable]);

  const reset = (): void => {
    setValue(null);
    setEditable(false);
  };

  const onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>): void => {
    setValue(value);
  };

  const onBlur = (): void => reset();
  const onKeyDown = ({ key }: KeyboardEvent<HTMLInputElement>): void => {
    switch (key) {
      case 'Escape':
        reset();
        break;
      case 'Enter':
        if (value !== null) {
          props.onRenamed(value);
        }
        setValue(null);
        setEditable(false);
        break;
    }
  };
  const onDoubleClick = (): void => setEditable(true);
  return (
    <div className="tab-label">
      <input
        ref={ref}
        value={getLabel()}
        readOnly={!editable || !workareaStore.connected}
        onChange={onChange}
        onBlur={onBlur}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
      />
      <button onClick={props.onClosed}>
        <i className="fa fa-times" />
      </button>
    </div>
  );
};
