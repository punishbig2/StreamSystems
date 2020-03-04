import {WindowElement} from 'components/WindowManager/window';
import React, {ReactElement, useState, useMemo, useEffect} from 'react';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {MessageBlotter} from 'components/MessageBlotter';
import {BlotterTypes} from 'redux/constants/messageBlotterConstants';
import getStyles from 'styles';
import {WindowState} from 'redux/stateDefs/windowState';

interface Props {
  toast: string | null;
  renderContent: (id: string, type: WindowTypes) => ReactElement | null;
  windows: { [id: string]: WindowState };
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
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [area, setArea] = useState<ClientRect>(BodyRectangle);
  const styles: any = getStyles();
  // Compute the ideal height
  const blotterHeight: number = useMemo(
    () =>
      styles.windowToolbarHeight +
      styles.tableHeaderHeight +
      4 * (styles.tableRowHeight + 1) + 1/* window padding */,
    [styles],
  );
  const fixedBlotterGeometry: DOMRect = useMemo(
    () => new DOMRect(0, area.height - blotterHeight, 0, blotterHeight),
    [blotterHeight, area],
  );
  const {renderContent} = props;
  // Get non-minimized windows
  const windows: [string, WindowState][] = Object.entries(props.windows || {});
  // Get minimized windows
  const minimized: [string, WindowState][] = windows.filter(
    ([, window]: [string, WindowState]): boolean => window.minimized,
  );
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
        geometry={geometry}
        key={id}
        area={area}
        isMinimized={window.minimized}
        autoSize={window.autoSize}
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
  const minimizedWindowMapper = ([, window]: [string, WindowState]) => {
    const onRestore = (id: string) => props.onWindowRestored(id);
    return (
      <div
        className={'window-button'}
        onClick={() => onRestore(window.id)}
        key={window.id}
      >
        <h1>{window.title || window.id}</h1>
      </div>
    );
  };
  const classes = ['workspace'];
  return (
    <div className={classes.join(' ')} onMouseLeave={props.onMouseLeave} ref={setElement}>
      {windows.map(windowMapper)}
      <WindowElement
        geometry={fixedBlotterGeometry}
        area={area}
        isMinimized={false}
        autoSize={true}
        fixed={true}
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
          blotterType={BlotterTypes.Fills}/>
      </WindowElement>
      <div className={'minimized-window-buttons'}>
        {minimized.map(minimizedWindowMapper)}
      </div>
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
