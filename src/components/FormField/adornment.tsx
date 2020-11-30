import React from "react";

interface Props {
  position: "end" | "start";
  value: string | undefined;
}

export const Adornment: React.FC<Props> = (
  props: Props
): React.ReactElement | null => {
  if (props.value === undefined || props.value === "") return null;
  return (
    <div className={["input-adornment", props.position].join(" ")}>
      {props.value}
    </div>
  );
};
