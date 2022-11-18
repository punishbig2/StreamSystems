import { useDateFormat } from 'hooks/useDateFormat';
import { useTimeFormat } from 'hooks/useTimeFormat';
import { observer } from 'mobx-react';
import React from 'react';

interface Props {
  readonly date: Date;
}

export const DateTimeRenderer: React.FC<Props> = observer((props: Props): React.ReactElement => {
  const { date } = props;

  const dateFormatter: Intl.DateTimeFormat = useDateFormat();
  const timeFormatter: Intl.DateTimeFormat = useTimeFormat();

  return (
    <div className="date-time-cell" title={date.toLocaleTimeString()}>
      <span className="date">{dateFormatter.format(date)}</span>
      <span className="time">{timeFormatter.format(date)}</span>
    </div>
  );
});
