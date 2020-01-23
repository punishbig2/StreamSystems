import React from "react";

interface OwnProps {
  value: string;
  setValue: (value: string) => void;
}

export const PresetQtyButton: React.FC<OwnProps> = (props: OwnProps) => {
  return (
    <button type={"button"} onClick={() => props.setValue(props.value)}>
      {props.value}
    </button>
  );
};
