import React, { ReactElement, PropsWithChildren } from "react";

type Props = PropsWithChildren<{}>;

export const GenericScrollArea: React.FC<Props> = (
  props: Props
): ReactElement => {
  return <div className={"generic-scroll-area"}>{props.children}</div>;
};
