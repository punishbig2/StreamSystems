import {WindowElement} from 'components/WindowManager/window';
import {Window} from 'interfaces/window';
import React, {ReactElement} from 'react';

interface Props {
  windows: { [id: string]: Window };
  onGeometryChange: (id: string, geometry: ClientRect) => void;
  renderWindow: (window: Window) => ReactElement;
}

const WindowManager: React.FC<Props> = (props: Props): ReactElement => {
  if (!props.windows)
    return <div/>;
  const entries: [string, Window][] = Object.entries(props.windows);
  return (
    <div className={'workspace'}>
      {entries.map(([id, window]: [string, Window]) => (
        <WindowElement geometry={window.geometry}
                       onGeometryChange={(geometry: ClientRect) => props.onGeometryChange(id, geometry)}
                       key={id}>
          {props.renderWindow(window)}
        </WindowElement>
      ))}
    </div>
  );
};

export {WindowManager};
