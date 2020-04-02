import { WindowElement } from 'components/WindowManager/window';
import React, { ReactElement, useState, useEffect } from 'react';
import getStyles, { Dimensions } from 'styles';
import { getOptimalSize } from 'windowUtils';
import { User } from 'interfaces/user';
import { ExecutionBlotter } from 'components/WindowManager/executionBlotter';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { WindowDef } from 'mobx/stores/workspace';

interface Props {
  toast: string | null;
  renderContent: (wID: string, type: WindowTypes) => ReactElement | null;
  windows: WindowDef[];
  isDefaultWorkspace: boolean;
  connected: boolean;
  personality: string;
  user: User;
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onWindowClose: (id: string) => void;
  onClearToast: () => void;
  onUpdateAllGeometries: (geometries: { [id: string]: ClientRect }) => void;
  onLayoutModify: () => void;
}

const BodyRectangle: ClientRect = document.body.getBoundingClientRect();

const WindowManager: React.FC<Props> = (props: Props): ReactElement | null => {
  const { isDefaultWorkspace, windows } = props;
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [area, setArea] = useState<ClientRect>(BodyRectangle);
  const styles: any = getStyles();

  const { renderContent } = props;

  useEffect(() => {
    if (element === null) return;
    const updateArea = () => {
      const height: number = element.offsetHeight;
      const width: number = element.offsetWidth;
      setArea(new DOMRect(0, 0, width, height));
    };
    const observer: ResizeObserver = new ResizeObserver(updateArea);
    updateArea();
    observer.observe(element);
    return () => observer.disconnect();
    // Update the element's area
  }, [element]);

  const { onUpdateAllGeometries } = props;
  const [layoutCompleted, setLayoutCompleted] = useState<boolean>(false);
  useEffect(() => {
    if (!isDefaultWorkspace || layoutCompleted || windows.length === 0)
      return;
    const reducer = (next: { [id: string]: ClientRect }, window: WindowDef, index: number, array: WindowDef[]) => {
      const element: HTMLElement | null = document.getElementById(window.id);
      if (element instanceof HTMLDivElement) {
        const { width, height } = getOptimalSize(element);
        if (index === 0) {
          next[window.id] = new DOMRect(0, 0, width, height);
        } else {
          const last: WindowDef = array[index - 1];
          const { left, top } = next[last.id];
          const { width: offsetWidth, height: offsetHeight } = next[last.id];
          const styles: Dimensions = getStyles();
          const finalHeight: number = index <= 7 ? offsetHeight : styles.windowToolbarHeight + styles.tableHeaderHeight;
          if (left + offsetWidth + width + 1 > area.right) {
            next[window.id] = new DOMRect(0, top + finalHeight + 1, width, finalHeight);
          } else {
            next[window.id] = new DOMRect(left + offsetWidth + 1, top, width, finalHeight);
          }
        }
        return next;
      }
      return next;
    };
    const windowsAreReady: boolean = windows.every((window: WindowDef) => {
      const element: HTMLElement | null = document.getElementById(window.id);
      return !(element === null || element.offsetWidth === 0 || element.offsetHeight === 0);
    });
    if (!windowsAreReady)
      return;
    setTimeout(() => {
      const geometries: { [key: string]: ClientRect } = windows.reduce(reducer, {});
      onUpdateAllGeometries(geometries);
    }, 0);
    setLayoutCompleted(true);
  }, [styles, windows, isDefaultWorkspace, onUpdateAllGeometries, area.bottom, area.right, layoutCompleted]);

  const windowMapper = (window: WindowDef): ReactElement => {
    const content: ReactElement | null = renderContent(window.id, window.type);
    const childProps: any = content ? content.props : {};
    return (
      <WindowElement key={window.id}
                     id={window.id}
                     area={area}
                     type={window.type}
                     geometry={window.geometry}
                     isDefaultWorkspace={isDefaultWorkspace}
                     onLayoutModify={props.onLayoutModify}
                     onClose={props.onWindowClose}>
        {content ? React.cloneElement(content, childProps) : null}
      </WindowElement>
    );
  };
  const classes = ['workspace'];
  return (
    <div className={classes.join(' ')} onMouseLeave={props.onMouseLeave} ref={setElement}>
      {windows.map(windowMapper)}
      <ExecutionBlotter connected={props.connected} personality={props.personality} user={props.user} area={area}/>
      <div className={['toast', props.toast !== null ? 'visible' : 'hidden'].join(' ')}>
        <div className={'message'}>{props.toast}</div>
        <div className={'close-button'} onClick={props.onClearToast}>
          <i className={'fa fa-times'}/>
        </div>
      </div>
    </div>
  );
};

export { WindowManager };
