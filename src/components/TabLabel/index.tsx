import React, { ChangeEvent, KeyboardEvent, useState, useEffect, useRef } from 'react';

interface Props {
  label: string;
  isDefault: boolean;
  onRenamed: (name: string) => void;
  onClosed: (event: React.MouseEvent) => void;
}

export const TabLabel: React.FC<Props> = (props: Props) => {
  const ref: React.Ref<HTMLInputElement> = useRef<HTMLInputElement>(null);
  const [editable, setEditable] = useState(false);
  const { label, isDefault } = props;
  const [value, setValue] = useState<string>(label);

  const getLabel = () => {
    const finalLabel: string = value;
    if (isDefault) {
      return `${finalLabel} (default)`;
    } else {
      return finalLabel;
    }
  };

  useEffect(() => {
    setValue(label);
  }, [label]);

  useEffect(() => {
    if (ref.current === null || !editable)
      return;
    const input: HTMLInputElement = ref.current;
    input.select();
  }, [ref, editable]);

  const reset = () => {
    setValue(props.label);
    setEditable(false);
  };

  const onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

  const onBlur = () => reset();
  const onKeyDown = ({ key }: KeyboardEvent<HTMLInputElement>) => {
    switch (key) {
      case 'Escape':
        reset();
        break;
      case 'Enter':
        props.onRenamed(value);
        setEditable(false);
        break;
    }
  };
  const onDoubleClick = () => setEditable(true);
  return (
    <div className={'tab-label'}>
      <input
        ref={ref}
        value={getLabel()}
        readOnly={!editable}
        onChange={onChange}
        onBlur={onBlur}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}/>
      <button onClick={props.onClosed}>
        <i className={'fa fa-times'}/>
      </button>
    </div>
  );
};
