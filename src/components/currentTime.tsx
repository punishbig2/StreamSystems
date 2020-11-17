import { TextField } from "@material-ui/core";
import { useTimer } from "hooks/useTimer";
import React, { ReactElement, useEffect, useState } from "react";
import {
  DateFormatter,
  DateTimeFormatter,
  TimeFormatter,
} from "utils/timeUtils";

interface Props {
  readonly dateOnly?: boolean;
  readonly timeOnly?: boolean;
}

export const CurrentTime: React.FC<Props> = (
  props: Props = {
    dateOnly: false,
    timeOnly: false,
  }
): ReactElement => {
  const date: Date = useTimer();
  const [formatter, setFormatter] = useState<Intl.DateTimeFormat>(
    new Intl.DateTimeFormat()
  );

  useEffect(() => {
    if (props.dateOnly) {
      setFormatter(DateFormatter);
    } else if (props.timeOnly) {
      setFormatter(TimeFormatter);
    } else {
      setFormatter(DateTimeFormatter);
    }
  }, [props.timeOnly, props.dateOnly]);

  return (
    <TextField
      style={{
        fontFamily: "inherit",
        fontSize: "inherit",
        fontWeight: "inherit",
      }}
    >
      {formatter.format(date)}
    </TextField>
  );
};
