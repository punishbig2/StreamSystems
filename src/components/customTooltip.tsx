import { Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

interface Props {
  readonly tooltipStyle: 'neutral' | 'good' | 'bad';
  readonly title?: string;
}

const foregrounds: { [key: string]: string } = {
  neutral: 'black',
  bad: 'white',
  good: 'white',
};

const backgrounds: { [key: string]: string } = {
  neutral: 'white',
  bad: 'darkred',
  good: 'seagreen',
};

const useErrorTooltipStyle = makeStyles(() => ({
  arrow: {
    color: (props: Props): string => backgrounds[props.tooltipStyle],
  },
  tooltip: {
    color: (props: Props): string => foregrounds[props.tooltipStyle],
    backgroundColor: (props: Props): string => backgrounds[props.tooltipStyle],
  },
}));

export const CustomTooltip: React.FC<React.PropsWithChildren<Props>> = (
  props: React.PropsWithChildren<Props>
): React.ReactElement => {
  const classes = useErrorTooltipStyle(props);
  if (props.title === undefined) return <div />;
  return (
    <Tooltip title={props.title} classes={classes} arrow>
      <div>{props.children}</div>
    </Tooltip>
  );
};
