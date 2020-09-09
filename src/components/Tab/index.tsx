import React, { ReactElement, PropsWithRef } from "react";

interface OwnProps {
  ref?: React.Ref<HTMLDivElement>;
  id?: string;
  label: string | ReactElement;
  active: boolean;
  onClick: (id?: string) => void;
}

type Props = PropsWithRef<OwnProps>;

const Tab: React.FC<Props> = React.forwardRef(
  (props: Props, ref?: React.Ref<HTMLDivElement>): ReactElement => {
    const classes: string[] = ["tab"];
    if (props.active) classes.push("active");
    const onClick = () => props.onClick(props.id);
    return (
      <div ref={ref} className={classes.join(" ")} onClick={onClick}>
        {props.label}
      </div>
    );
  }
);

export { Tab };
