import React, { ReactNode } from 'react';

interface Props {
  readonly action?: () => ReactNode;
  readonly label: string | React.ReactElement;
  readonly className?: string;
  readonly disabled?: boolean;
}

export const DualTableHeader: React.FC<Props> = (props: Props): React.ReactElement => {
  const { action } = props;
  const classes: string[] = ['dual-header'];
  if (props.className !== undefined) classes.push(props.className);
  return (
    <div className={classes.join(' ')}>
      <div className="first">{props.label}</div>
      <div className="second">{action ? action() : <div>&nbsp;</div>}</div>
    </div>
  );
};
