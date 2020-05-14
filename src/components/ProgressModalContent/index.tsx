import React, { ReactElement } from "react";

interface OwnProps {
  startTime: number;
  maximum: number;
  progress: number;
}

export const ProgressModalContent: React.FC<OwnProps> = (
  props: OwnProps
): ReactElement | null => {
  let remainingSeconds: number = Date.now() - props.startTime;
  const pad = (value: number) => (value < 10 ? "0" + value : value.toString());

  const percent: number = Math.round((100 * props.progress) / props.maximum);
  const hours: number = Math.round(remainingSeconds / 3600000);
  const minutes: number = Math.round(
    (remainingSeconds - 3600000 * hours) / 60000
  );
  const seconds: number = Math.round(
    (remainingSeconds - 60000 * minutes) / 1000
  );
  return (
    <div className={"progress-dialog"}>
      <div className={"header"}>
        {props.maximum < 0 ? <div className={"spinner"} /> : null}
        <div className={"title"}>
          <h1>Creating orders&hellip;</h1>
          <div className={"timer"}>
            Time elapsed: {pad(hours)}:{pad(minutes)}:{pad(seconds)}
          </div>
        </div>
      </div>
      {props.maximum < 0 ? null : (
        <div data-value={percent} className={"progress"}>
          <div className={"value"} style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
};
