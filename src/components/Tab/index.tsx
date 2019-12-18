import React, {ReactElement} from 'react';

interface Props {
  onClick: (id: string) => void;
  label: string | ReactElement;
  active: boolean;
  id: string;
}

const Tab: React.FC<Props> = (props: Props): ReactElement => {
  const classes: string[] = ['tab'];
  if (props.active)
    classes.push('active');
  return (
    <div className={classes.join(' ')} onClick={() => props.onClick(props.id)}>
      {props.label}
    </div>
  );
};

export {Tab};
