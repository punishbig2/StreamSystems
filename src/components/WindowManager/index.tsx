import { WindowElement } from 'components/WindowManager/windowElement';
import React, { ReactElement, useState, useEffect } from 'react';
import getStyles from 'styles';
import { getOptimalSize } from 'windowUtils';
import { User } from 'interfaces/user';
import { ExecutionBlotter } from 'components/WindowManager/executionBlotter';
import { WindowDef } from 'mobx/stores/workspaceStore';
import { PodTileStore } from 'mobx/stores/podTileStore';
import { MessagesStore } from 'mobx/stores/messagesStore';
import { WindowTypes } from 'mobx/stores/workareaStore';

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

interface Size {
  width: number;
  height: number;
}

const BodyRectangle: ClientRect = new DOMRect(0, 0, window.innerWidth, window.innerHeight);

const WindowManager: React.FC<Props> = (props: Props): ReactElement | null => {
  const { isDefaultWorkspace, windows } = props;
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [area, setArea] = useState<ClientRect>(BodyRectangle);
  const styles: any = getStyles();

  useEffect(() => {
    if (element === null)
      return;
    const updateArea = () => {
      const { width, height } = element.getBoundingClientRect();
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
    const limits: DOMRect | ClientRect = document.body.getBoundingClientRect();
    setTimeout(() => {
      const sorted: WindowDef[] = [...windows];
      sorted.sort((w1: WindowDef, w2: WindowDef) => w1.position - w2.position);
      const sizes: Size[] = sorted.map((windowDef: WindowDef) => {
        const element: HTMLElement | null = document.getElementById(windowDef.id);
        if (element instanceof HTMLDivElement) {
          return getOptimalSize(element);
        } else {
          return { width: 0, height: 0 };
        }
      });
      const reducer = (result: ClientRect[], size: Size, index: number): ClientRect[] => {
        const { width, height } = size;
        if (index === 0) {
          result.push(new DOMRect(0, 0, width, height));
        } else {
          const { left, top, width: offsetWidth, height: offsetHeight } = result[index - 1];
          if (top + offsetHeight + height >= limits.bottom) {
            result.push(new DOMRect(left + offsetWidth + 1, 0, size.width, size.height));
          } else {
            result.push(new DOMRect(left, top + offsetHeight + 1, size.width, size.height));
          }
        }
        return result;
      };
      const geometries: ClientRect[] = sizes.reduce(reducer, []);
      onUpdateAllGeometries(geometries.reduce((map: { [k: string]: ClientRect }, geometry: ClientRect, index: number) => {
        const window: WindowDef = sorted[index];
        map[window.id] = geometry;
        return map;
      }, {}));
    }, 0);
    setLayoutCompleted(true);
  }, [styles, windows, isDefaultWorkspace, onUpdateAllGeometries, layoutCompleted, area]);

  const windowMapper = (window: WindowDef): ReactElement => {
    return (
      <WindowElement id={window.id}
                     type={window.type}
                     content={props.getContentRenderer(window.id, window.type)}
                     title={props.getTitleRenderer(window.id, window.type)}
                     key={window.id}
                     minimized={window.minimized}
                     geometry={window.geometry}
                     fitToContent={window.fitToContent}
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
