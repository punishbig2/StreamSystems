import { ProgressBar } from "components/progressBar";
import React, { ReactElement } from "react";

interface Props {
  readonly value: number;
  readonly message: string;
  readonly title: string;
}

export const ProgressView: React.FC<Props> = (props: Props): ReactElement => {
  const { value } = props;
  const valueStr = value !== null ? `${value.toFixed(0)}%` : null;
  if (value !== null && (value < 0 || value > 100))
    throw new Error("value can only be in the range [0, 100]");
  return (
    <div className={"loading-view"}>
      <div className={"image"}>
        <img alt={""} src={"/images/stream-logo.png"} />
      </div>
      <div className={"content"}>
        <div className={"title"}>
          <div className={"label"}>{props.title}</div>
          <div className={"percent"}>{valueStr}</div>
        </div>
        <ProgressBar value={value} />
        <div className={"message"}>{props.message}&hellip;</div>
      </div>
    </div>
  );
};
