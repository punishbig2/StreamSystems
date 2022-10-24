import { TextField } from "@material-ui/core";
import { useTimer } from "hooks/useTimer";
import workareaStore from "mobx/stores/workareaStore";
import React, { ReactElement, useEffect, useState } from "react";
import { useDateFormat } from "hooks/useDateFormat";
import { useDateTimeFormat } from "hooks/useDateTimeFormat";
import { useTimeFormat } from "hooks/useTimeFormat";

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
  const dateFormatter = useDateFormat();
  const dateTimeFormatter = useDateTimeFormat();
  const timeFormatter = useTimeFormat();

  const [formatter, setFormatter] = useState<Intl.DateTimeFormat>(
    new Intl.DateTimeFormat()
  );

  useEffect(() => {
    if (props.dateOnly) {
      setFormatter(dateFormatter);
    } else if (props.timeOnly) {
      setFormatter(timeFormatter);
    } else {
      setFormatter(dateTimeFormatter);
    }
  }, [
    props.timeOnly,
    props.dateOnly,
    dateFormatter,
    timeFormatter,
    dateTimeFormatter,
  ]);

  return (
    <TextField
      disabled={!workareaStore.connected}
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
