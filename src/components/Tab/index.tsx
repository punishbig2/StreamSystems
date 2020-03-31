import React, {ReactElement, PropsWithRef} from 'react';

interface OwnProps {
  onClick: (id: string) => void;
  label: string | ReactElement;
  active: boolean;
  id: string;
  ref?: React.Ref<HTMLDivElement>;
}

type Props = PropsWithRef<OwnProps>;

const Tab: React.FC<Props> = React.forwardRef((props: Props, ref?: React.Ref<HTMLDivElement>): ReactElement => {
  const classes: string[] = ['tab'];
  if (props.active) classes.push('active');
  return (
    <div ref={ref} className={classes.join(' ')} onClick={() => props.onClick(props.id)}>
      {props.label}
    </div>
  );
});

export {Tab};
