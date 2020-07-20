import React, { ReactElement, useEffect, useState } from "react";
import moment from "moment";

interface OwnProps {
  startTime: number;
  maximum: number;
  message: string;
  progress: number;
}

export const ProgressModalContent: React.FC<OwnProps> = (
  props: OwnProps
): ReactElement | null => {
  const [now, setNow] = useState<number>(Date.now());
  const percent: number = Math.round((100 * props.progress) / props.maximum);
  const elapsedTime: moment.Moment = moment.utc(now - props.startTime);
  useEffect(() => {
    setTimeout(() => {
      setNow(Date.now());
    }, 1000);
  });
  return (
    <div className={"progress-dialog"}>
      <div className={"header"}>
        {props.maximum < 0 ? <div className={"spinner"} /> : null}
        <div className={"title"}>
          <h1>{props.message}</h1>
          <div className={"timer"}>
            Time elapsed: {elapsedTime.format("HH:mm:ss")}
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
