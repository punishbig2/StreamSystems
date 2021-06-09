import React from "react";

interface Props {
  readonly disconnected: boolean;
}

export const DisconnectedIndicator: React.FC<Props> = (
  props: Props
): React.ReactElement => {
  return <div className={props.disconnected ? "disconnected" : "invisible"} />;
};
