import { WorkareaError } from "components/Workarea/workareaError";
import workareaStore from "mobx/stores/workareaStore";
import { Moment } from "moment";
import React from "react";
import { parseAsNYTime } from "utils/parseAsNYTime";

export const UserNotAllowedAtThisTime: React.FC = (): React.ReactElement => {
  const { trading_start_time, trading_end_time } = workareaStore.workSchedule;
  const bod: Moment = React.useMemo(
    (): Moment => parseAsNYTime(trading_start_time),
    [trading_start_time]
  );
  const eod: Moment = React.useMemo(
    (): Moment => parseAsNYTime(trading_end_time),
    [trading_end_time]
  );

  const title = "Access Denied";
  const detail =
    "You cannot access the trading system at this moment. Please try again later." +
    ` The system is active Monday to Friday from ${bod.format(
      "hh:mm a"
    )} to ${eod.format("hh:mm a")}.`;

  return <WorkareaError title={title} detail={detail} shouldReload={false} />;
};
