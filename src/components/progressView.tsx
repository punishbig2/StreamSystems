import { ProgressBar } from "components/progressBar";
import React, { ReactElement } from "react";

interface Props {
  value: number;
  message: string;
  title: string;
}

export const ProgressView: React.FC<Props> = (props: Props): ReactElement => {
  const { value } = props;
  if (value < 0 || value > 100)
    throw new Error("value can only be in the range [0, 100]");
  return (
    <div className={"loading-view"}>
      <div className={"image"} />
      <div className={"content"}>
        <div className={"application-brand"}>
          <h1>FX Options</h1>
        </div>
        <div className={"title"}>
          <div className={"label"}>{props.title}</div>
          <div className={"percent"}>{value.toFixed(0)}%</div>
        </div>
        <ProgressBar value={value} />
        <div className={"message"}>{props.message}&hellip;</div>
      </div>
    </div>
  );
};
