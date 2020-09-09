import { TextField } from "@material-ui/core";
import React, { ReactElement, useState, useEffect } from "react";
import { Globals } from "golbals";
import { useTimer } from "hooks/useTimer";

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
      setFormatter(
        new Intl.DateTimeFormat(undefined, {
          timeZone: Globals.timezone || undefined,
          year: "numeric",
          month: "numeric",
          day: "numeric",
        })
      );
    } else if (props.timeOnly) {
      setFormatter(
        new Intl.DateTimeFormat(undefined, {
          timeZone: Globals.timezone || undefined,
          hour: "numeric",
          minute: "numeric",
        })
      );
    } else {
      setFormatter(
        new Intl.DateTimeFormat(undefined, {
          timeZone: Globals.timezone || undefined,
        })
      );
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
