import { WindowElement } from 'components/WindowManager/windowElement';
import React, { ReactElement, useState, useEffect } from 'react';
import getStyles from 'styles';
import { getOptimalSize } from 'windowUtils';
import { User } from 'interfaces/user';
import { ExecutionBlotter } from 'components/WindowManager/executionBlotter';
import { WindowDef } from 'mobx/stores/workspace';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { PodTileStore } from 'mobx/stores/podTile';
import { MessagesStore } from 'mobx/stores/messages';

interface Props {
  toast: string | null;
  windows: WindowDef[];
  isDefaultWorkspace: boolean;
  connected: boolean;
  personality: string;
  user: User;
  getContentRenderer: (id: string, type: WindowTypes) => ((props: any, store: PodTileStore | MessagesStore | null) => ReactElement | string | null);
  getTitleRenderer: (id: string, type: WindowTypes) => ((props: any, store: PodTileStore | MessagesStore | null) => ReactElement | string | null);
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
          if (top + offsetHeight + 1 > area.height) {
            next[window.id] = new DOMRect(left + offsetWidth + 1, 0, width, height);
          } else {
            next[window.id] = new DOMRect(left, top + offsetHeight + 1, width, height);
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
      const sorted: WindowDef[] = [...windows];
      sorted.sort((w1: WindowDef, w2: WindowDef) => w1.position - w2.position);
      const geometries: { [key: string]: ClientRect } = sorted.reduce(reducer, {});
      onUpdateAllGeometries(geometries);
    }, 0);
    setLayoutCompleted(true);
  }, [styles, windows, isDefaultWorkspace, onUpdateAllGeometries, area.bottom, area.right, layoutCompleted, area.height]);

  const windowMapper = (window: WindowDef): ReactElement => {
    return (
      <WindowElement id={window.id}
                     type={window.type}
                     content={props.getContentRenderer(window.id, window.type)}
                     title={props.getTitleRenderer(window.id, window.type)}
                     key={window.id}
                     minimized={window.minimized}
                     geometry={window.geometry}
                     area={area}
                     connected={props.connected}
                     user={props.user}
                     personality={props.personality}
                     isDefaultWorkspace={isDefaultWorkspace}
                     onLayoutModify={props.onLayoutModify}
                     onClose={props.onWindowClose}/>
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
