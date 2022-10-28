import React from "react";

interface OwnProps {
  readonly value: number;
  readonly setValue: (value: number) => void;
}

export const PresetSizeButton: React.FC<OwnProps> = (props: OwnProps) => {
  return (
    <button type="button" onClick={() => props.setValue(props.value)}>
      {props.value}
    </button>
  );
};
