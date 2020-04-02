import React, { ReactElement, PropsWithChildren, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface OwnProps {
  target: HTMLDivElement | null;
  onClose: () => void;
}

type Props = PropsWithChildren<OwnProps>;

export const Tooltip: React.FC<Props> = (props: Props): ReactElement | null => {
  const [style, setStyle] = useState<any>({});
  const { target } = props;
  useEffect(() => {
    if (target === null)
      return;
    const bounds: ClientRect = target.getBoundingClientRect();
    setStyle({
      left: (bounds.right - 8) + 'px',
      top: (bounds.bottom - 8) + 'px',
    });
  }, [target]);
  if (target === null)
    return null;
  const element: ReactElement = (
    <div className={'tooltip'} style={style}>
      <div className={'tooltip-content'}>
        {props.children}
      </div>
    </div>
  );
  const container: HTMLElement | null = document.getElementById('tooltips');
  if (container === null)
    return null;
  return ReactDOM.createPortal(element, container);
};
