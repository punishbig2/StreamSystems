import React, { PropsWithRef, ReactElement } from 'react';

interface OwnProps {
  ref?: React.Ref<HTMLDivElement>;
  id?: string;
  label: string | ReactElement;
  active: boolean;
  onClick: (id?: string) => void;
}

type Props = PropsWithRef<OwnProps>;

const Tab: React.FC<Props> = React.forwardRef(function Tab(
  props: Props,
  ref?: React.Ref<HTMLDivElement>
): ReactElement {
  const classes: string[] = ['tab'];
  if (props.active) classes.push('active');
  const onClick = (): void => props.onClick(props.id);
  return (
    <div ref={ref} className={classes.join(' ')} onClick={onClick}>
      {props.label}
    </div>
  );
});

export { Tab };
