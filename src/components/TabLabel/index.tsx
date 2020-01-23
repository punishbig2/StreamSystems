import React, { ChangeEvent, KeyboardEvent, useState } from "react";

interface Props {
  label: string;
  onRenamed: (name: string) => void;
  onClosed: (event: React.MouseEvent) => void;
}

export const TabLabel: React.FC<Props> = (props: Props) => {
  const [editable, setEditable] = useState(false);
  const [value, setValue] = useState(props.label);
  const cancel = () => {
    setValue(props.label);
    setEditable(false);
  };
  const onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };
  const onBlur = () => cancel();
  const onKeyDown = ({ key }: KeyboardEvent<HTMLInputElement>) => {
    switch (key) {
      case "Escape":
        cancel();
        break;
      case "Enter":
        props.onRenamed(value);
        setEditable(false);
        break;
    }
  };
  const onDoubleClick = () => setEditable(true);
  return (
    <div className={"tab-label"}>
      <input
        value={value}
        readOnly={!editable}
        onChange={onChange}
        onBlur={onBlur}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
      />
      <button onClick={props.onClosed}>
        <i className={"fa fa-times"} />
      </button>
    </div>
  );
};
