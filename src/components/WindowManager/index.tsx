import {WindowElement} from 'components/WindowManager/window';
import React, {ReactElement, useState, useMemo, useEffect} from 'react';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {MessageBlotter} from 'components/MessageBlotter';
import {BlotterTypes} from 'redux/constants/messageBlotterConstants';
import getStyles from 'styles';
import {WindowState} from 'redux/stateDefs/windowState';
import {getOptimalSize, addClass} from 'windowUtils';

interface Props {
  toast: string | null;
  renderContent: (id: string, type: WindowTypes) => ReactElement | null;
  windows: { [id: string]: WindowState };
  isDefaultWorkspace: boolean;
  connected: boolean;
  personality: string;
  onGeometryChange: (id: string, geometry: ClientRect, resized: boolean) => void;
  onWindowMinimized: (id: string) => void;
  onWindowClosed: (id: string) => void;
  onWindowTitleChanged: (id: string, title: string) => void;
  onWindowRestored: (id: string) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onWindowClicked: (id: string) => void;
  onWindowSizeAdjusted: (id: string) => void;
  onClearToast: () => void;
  onUpdateAllGeometries: (geometries: { [id: string]: ClientRect }) => void;
}

const Callbacks: { [id: string]: { [name: string]: (...args: any[]) => void } } = {};
const getCallback = (id: string, name: string, fallback: (...args: any[]) => any): ((...args: any[]) => any) => {
  if (Callbacks[id] === undefined)
    Callbacks[id] = {};
  if (Callbacks[id][name] === undefined)
    Callbacks[id][name] = fallback;
  return Callbacks[id][name];
};

const BodyRectangle: ClientRect = document.body.getBoundingClientRect();
const WindowManager: React.FC<Props> = (props: Props): ReactElement | null => {
  const {isDefaultWorkspace} = props;
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [area, setArea] = useState<ClientRect>(BodyRectangle);
  const styles: any = getStyles();
  // Compute the ideal height
  const blotterHeight: number = useMemo(
    () => styles.windowToolbarHeight + styles.tableHeaderHeight + 4 * styles.tableRowHeight,
    [styles],
  );
  const fixedBlotterGeometry: DOMRect = useMemo(
    () => new DOMRect(0, area.height - blotterHeight, 0, blotterHeight),
    [blotterHeight, area],
  );
  const {renderContent} = props;
  // Get non-minimized windows
  const windows: [string, WindowState][] = Object.entries(props.windows || {});

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

  const [layoutCompleted, setLayoutCompleted] = useState<boolean>(false);
  const {onUpdateAllGeometries} = props;
  useEffect(() => {
    if (!isDefaultWorkspace || layoutCompleted)
      return;
    const reducer = (next: { [id: string]: ClientRect }, [, window]: [string, WindowState], index: number, array: [string, WindowState][]) => {
      const element: HTMLElement | null = document.getElementById(window.id) as HTMLElement;
      if (element instanceof HTMLDivElement) {
        const {width, height} = getOptimalSize(element);
        if (index === 0) {
          next[window.id] = new DOMRect(0, 0, width, height);
        } else {
          const [, last]: [string, WindowState] = array[index - 1];
          const {left, top} = next[last.id];
          const {width: offsetWidth, height: offsetHeight} = next[last.id];
          console.log(window.id, offsetHeight, height);
          if (left + offsetWidth + width + 1 > area.right) {
            next[window.id] = new DOMRect(0, top + offsetHeight + 1, width, height);
          } else {
            next[window.id] = new DOMRect(left + offsetWidth + 1, top, width, height);
          }
        }
        return next;
      }
      return next;
    };
    const objects: [string, WindowState][] = Object.values(windows);
    const windowsAreReady: boolean = objects.every(([, window]: [string, WindowState]) => {
      const rows = Object.values(window.rows);
      return !!rows.length;
    });
    if (!windowsAreReady)
      return;
    setTimeout(() => {
      const geometries: { [key: string]: ClientRect } = objects.reduce(reducer, {});
      onUpdateAllGeometries(geometries);
    }, 0);
    setLayoutCompleted(windowsAreReady);
  }, [styles, windows, isDefaultWorkspace, onUpdateAllGeometries, layoutCompleted, area.bottom, area.right]);

  const windowMapper = ([id, window]: [string, WindowState]): ReactElement => {
    const {type} = window;
    const content: ReactElement | null = renderContent(id, type);
    const geometry: ClientRect | undefined = window.geometry;
    // Geometries of sibling windows
    const updateGeometry = getCallback(
      id,
      'geometry-changed',
      (geometry: ClientRect, resized: boolean) =>
        props.onGeometryChange(id, geometry, resized),
    );
    const onSetTitle = getCallback(id, 'set-title', (title: string) =>
      props.onWindowTitleChanged(id, title),
    );
    const onMinimize = getCallback(id, 'on-window-minimized', () =>
      props.onWindowMinimized(id),
    );
    const onClose = getCallback(id, 'on-window-closed', () =>
      props.onWindowClosed(id),
    );
    const onClick = getCallback(id, 'on-click', () =>
      props.onWindowClicked(id),
    );
    const onWindowSizeAdjusted = getCallback(
      id,
      'on-window-size-adjusted',
      () => props.onWindowSizeAdjusted(id),
    );
    const childProps: any = content ? content.props : {};
    return (
      <WindowElement
        id={id}
        geometry={geometry}
        key={id}
        area={area}
        isMinimized={window.minimized}
        autoSize={window.autoSize}
        isDefaultWorkspace={isDefaultWorkspace}
        onSaveWindowGeometry={() => null}
        onGeometryChange={updateGeometry}
        onClose={onClose}
        onMinimize={onMinimize}
        onSetTitle={onSetTitle}
        onClick={onClick}
        onAdjustSize={onWindowSizeAdjusted}>
        {content ? React.cloneElement(content, {...childProps, autoSize: window.autoSize}) : null}
      </WindowElement>
    );
  };
  const classes = ['workspace'];
  return (
    <div className={classes.join(' ')} onMouseLeave={props.onMouseLeave} ref={setElement}>
      {windows.map(windowMapper)}
      <WindowElement
        id={'___IGNORED_ID___'}
        geometry={fixedBlotterGeometry}
        area={area}
        isMinimized={false}
        autoSize={true}
        fixed={true}
        isDefaultWorkspace={false}
        onSaveWindowGeometry={() => null}
        onGeometryChange={() => null}
        onClose={() => null}
        onMinimize={() => null}
        onSetTitle={() => null}
        onClick={() => null}
        onAdjustSize={() => null}>
        <MessageBlotter
          id={'fills-blotter'}
          onTitleChange={() => null}
          connected={props.connected}
          personality={props.personality}
          blotterType={BlotterTypes.Executions}/>
      </WindowElement>
      <div className={['toast', props.toast !== null ? 'visible' : 'hidden'].join(' ')}>
        <div className={'message'}>{props.toast}</div>
        <div className={'close-button'} onClick={props.onClearToast}>
          <i className={'fa fa-times'}/>
        </div>
      </div>
    </div>
  );
};

export {WindowManager};
