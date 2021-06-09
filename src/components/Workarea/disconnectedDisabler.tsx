import React from "react";

interface Props {
  readonly disconnected: boolean;
}

export const DisconnectedDisabler: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  const classes = ["disconnect-disabler"];
  if (props.disconnected) classes.push("disconnected");
  return <div className={classes.join(" ")} />;
};
