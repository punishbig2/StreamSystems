import React, {
  ChangeEvent,
  KeyboardEvent,
  useState,
  useEffect,
  useRef,
} from "react";

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
  const [value, setValue] = useState<string | null>(null);

  const getLabel = () => {
    const finalLabel: string =
      value === null ? (label !== "" ? label : "Untitled") : value;
    if (isDefault && value === null) {
      return `${finalLabel} (default)`;
    } else {
      return finalLabel;
    }
  };

  useEffect(() => {
    if (ref.current === null || !editable) return;
    const input: HTMLInputElement = ref.current;
    input.select();
  }, [ref, editable]);

  const reset = () => {
    setValue(null);
    setEditable(false);
  };

  const onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

  const onBlur = () => reset();
  const onKeyDown = ({ key }: KeyboardEvent<HTMLInputElement>) => {
    switch (key) {
      case "Escape":
        reset();
        break;
      case "Enter":
        if (value !== null) {
          props.onRenamed(value);
        }
        setValue(null);
        setEditable(false);
        break;
    }
  };
  const onDoubleClick = () => setEditable(true);
  return (
    <div className={"tab-label"}>
      <input
        ref={ref}
        value={getLabel()}
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
