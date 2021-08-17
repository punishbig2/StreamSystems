import { WorkareaError } from "components/Workarea/workareaError";
import workareaStore from "mobx/stores/workareaStore";
import moment, { Moment } from "moment";
import React from "react";

const toMoment = (value: string): Moment => {
  return moment(value, "HH:mm:SS");
};

const getNextWeekDay = (since: Moment): Moment => {
  const nextDay = since.add(1, "d");
  if (nextDay.weekday() === 0) {
    return nextDay.add(1, "d");
  } else if (nextDay.weekday() === 6) {
    return nextDay.add(2, "d");
  } else {
    return nextDay;
  }
};

export const UserNotAllowedAtThisTime: React.FC = (): React.ReactElement => {
  const { trading_start_time, end_of_day_time } = workareaStore.workSchedule;
  const bod: Moment = React.useMemo(
    (): Moment => toMoment(trading_start_time),
    [trading_start_time]
  );
  const eod: Moment = React.useMemo((): Moment => toMoment(end_of_day_time), [
    end_of_day_time,
  ]);

  const nextActiveDateTime = getNextWeekDay(bod);

  const title = "Access Denied";
  const detail =
    "You cannot access the trading system at this moment. Please try again later." +
    ` The system is only active Monday to Friday from ${bod.format(
      "hh:mm a"
    )} to ${eod.format(
      "hh:mm a"
    )}. Please come back ${nextActiveDateTime.format("MM/DD/YYYY hh:mm:SS a")}`;

  return <WorkareaError title={title} detail={detail} shouldReload={false} />;
};
