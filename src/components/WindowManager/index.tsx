import { ExecutionBlotter } from "components/WindowManager/executionBlotter";
import { Props } from "components/WindowManager/props";
import { WindowElement } from "components/WindowManager/WindowElement";
import { useSnapToNeighbors } from "hooks/useSnapToNeighbors";
import { WindowDef } from "mobx/stores/workspaceStore";
import React, { ReactElement, useEffect, useState } from "react";
import getStyles from "styles";

const BodyRectangle: ClientRect = new DOMRect(
  0,
  0,
  window.innerWidth,
  window.innerHeight
);

const WindowManager: React.FC<Props> = (props: Props): ReactElement | null => {
  const setGeometries = props.onUpdateAllGeometries;
  const { isDefaultWorkspace: ready, windows } = props;
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [area, setArea] = useState<ClientRect>(BodyRectangle);
  const styles: any = getStyles();

  useEffect(() => {
    if (element === null) return;
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

  const geometries: { [id: string]: ClientRect } = useSnapToNeighbors(
    styles,
    windows,
    ready,
    area
  );

  // When geometries change, we must update them in the manager
  useEffect(() => {
    // The geometries have changed
    setGeometries(geometries);
  }, [geometries, setGeometries]);

  const windowMapper = (window: WindowDef): ReactElement => {
    return (
      <WindowElement
        id={window.id}
        type={window.type}
        content={props.getContentRenderer(window.id, window.type)}
        title={props.getTitleRenderer(window.id, window.type)}
        key={window.id}
        minimized={window.minimized}
        geometry={window.geometry}
        fitToContent={window.fitToContent}
        area={area}
        isDefaultWorkspace={ready}
        onLayoutModify={props.onLayoutModify}
        onClose={props.onWindowClose}
      />
    );
  };
  const classes = ["workspace"];
  return (
    <div
      className={classes.join(" ")}
      onMouseLeave={props.onMouseLeave}
      ref={setElement}
    >
      {windows.map(windowMapper)}
      <ExecutionBlotter area={area} />
      <div
        className={["toast", props.toast !== null ? "visible" : "hidden"].join(
          " "
        )}
      >
        <div className={"message"}>{props.toast}</div>
        <div className={"close-button"} onClick={props.onClearToast}>
          <i className={"fa fa-times"} />
        </div>
      </div>
    </div>
  );
};

export { WindowManager };
