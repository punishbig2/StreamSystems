import React, { ReactNode } from "react";

interface Props {
  action?: () => ReactNode;
  label: string | (() => ReactNode);
  className?: string;
  disabled?: boolean;
}

export const DualTableHeader = (props: Props) => {
  const { action } = props;
  const classes: string[] = ["dual-header"];
  if (props.className !== undefined) classes.push(props.className);
  return (
    <div className={classes.join(" ")}>
      <div className={"first"}>{props.label}</div>
      <div className={"second"}>{action ? action() : <div>&nbsp;</div>}</div>
    </div>
  );
};
