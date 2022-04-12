import React, { ReactElement, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import styles from "styles";

interface OwnProps {
  readonly testId: string;
  readonly list: ReadonlyArray<{ readonly name: string }>;
  readonly value: string;
  readonly empty?: string;
  readonly searchable?: boolean;
  readonly fit?: boolean;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

export const Select: React.FC<OwnProps> = (props: OwnProps) => {
  const { list, value } = props;

  const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [position, setPosition] = useState<ClientRect>(new DOMRect());
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [keyword, setKeyword] = useState<string>("");
  const [dropdown, setDropdown] = useState<HTMLUListElement | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const onChange = (event: React.FormEvent<HTMLSelectElement>): void => {
    const { currentTarget } = event;
    props.onChange(currentTarget.value);
  };

  const showDropdown = (event: React.FormEvent<HTMLElement>): void => {
    if (isDropdownVisible) return;
    event.preventDefault();
    event.stopPropagation();
    // Show the dropdown now
    setDropdownVisible(true);
    // Get the geometry to locate the dropdown
    if (container !== null) {
      const boundingBox: ClientRect = container.getBoundingClientRect();
      setPosition(
        new DOMRect(
          boundingBox.left - 4,
          boundingBox.bottom,
          boundingBox.width + 8,
          -1
        )
      );
    }
  };

  const setInput = (input: HTMLInputElement | null) => {
    if (input === null) return;
    input.focus();
  };

  const positionToStyle = (position: ClientRect) => {
    return {
      top: `${position.top}px`,
      width: `${position.width}px`,
      left: `${position.left}px`,
      height: "auto",
      maxHeight:
        window.innerHeight - position.top - styles().windowToolbarHeight + "px",
    };
  };

  useEffect((): void | (() => void) => {
    if (!isDropdownVisible) return;

    const ignore = (event: Event): void => {
      event.stopImmediatePropagation();
      event.stopPropagation();
    };
    const options = { passive: false, capture: true };
    // Install event listeners to ignore these events
    document.addEventListener("wheel", ignore, options);
    document.addEventListener("keydown", ignore, options);

    return (): void => {
      document.removeEventListener("keydown", ignore, options);
      document.removeEventListener("wheel", ignore, options);
    };
  }, [isDropdownVisible]);

  useEffect(() => {
    if (!isDropdownVisible || dropdown === null) return;
    const isChildOf = (
      parent: HTMLElement | ChildNode,
      child: HTMLElement | null
    ): boolean => {
      if (child === null) return false;
      const array: ChildNode[] = Array.from(parent.childNodes);
      if (array.includes(child)) return true;
      return array.some((next: ChildNode) => isChildOf(next, child));
    };
    const onClickOutside = ({ target }: MouseEvent) => {
      if (target === dropdown || isChildOf(dropdown, target as HTMLElement))
        return;
      setDropdownVisible(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isDropdownVisible, dropdown]);

  useEffect(() => {
    if (!isDropdownVisible) return;
    setSelectedValue(value);
    setKeyword("");
  }, [isDropdownVisible, value, list]);

  const filtered: any[] = useMemo(
    (): Array<{ name: string }> =>
      list.filter(({ name }: { name: string }) => {
        const lowerName: string = name.toLowerCase();
        if (keyword.trim() === "") return true;
        return lowerName.startsWith(keyword.toLowerCase());
      }),
    [list, keyword]
  );

  useEffect(() => {
    const index: number = filtered.findIndex(
      (item: { name: string }): boolean => item.name === selectedValue
    );
    if (index === -1) {
      if (filtered.length === 0) return;
      if (selectedValue === filtered[0].name) return;
      setSelectedValue(filtered[0].name);
    } else {
      if (selectedValue === filtered[index].name) return;
      setSelectedValue(filtered[index]);
    }
  }, [selectedValue, filtered]);

  const onSearchChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setKeyword(value);
  };

  const setSelectedItem = (value: string) => {
    setDropdownVisible(false);
    props.onChange(value);
  };

  const renderDropdown = (): ReactElement | null => {
    if (!isDropdownVisible) return null;

    const swallowMouse = (event: React.MouseEvent<HTMLUListElement>) => {
      event.stopPropagation();
      event.preventDefault();
    };

    const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();
      const index: number = filtered.findIndex(
        (item: { name: string }): boolean => item.name === selectedValue
      );
      switch (event.key) {
        case "ArrowUp":
          if (filtered.length === 0) return;
          if (index === 0) {
            setSelectedValue(filtered[filtered.length - 1].name);
          } else if (index !== -1) {
            setSelectedValue(filtered[index - 1].name);
          } else {
            setSelectedValue(filtered[0].name);
          }
          break;
        case "ArrowDown":
          if (filtered.length === 0) return;
          if (index === filtered.length - 1) {
            setSelectedValue(filtered[0].name);
          } else if (index !== -1) {
            setSelectedValue(filtered[index + 1].name);
          } else {
            setSelectedValue(filtered[0].name);
          }
          break;
        case "Enter":
          if (selectedValue !== null) {
            setSelectedItem(selectedValue);
          }
          break;
        case "Escape":
          setDropdownVisible(false);
          break;
      }
    };

    const searchBox: ReactElement = (
      <div>
        <input
          readOnly={props.disabled}
          ref={setInput}
          placeholder={"Search"}
          value={keyword}
          onChange={onSearchChange}
          onKeyDown={onSearchKeyDown}
        />
      </div>
    );

    const classes = ["dropdown"];
    if (props.disabled) {
      classes.push("disabled");
    }

    return ReactDOM.createPortal(
      <div className={classes.join(" ")} style={positionToStyle(position)}>
        {props.searchable && searchBox}
        <ul onMouseDownCapture={swallowMouse} ref={setDropdown}>
          {filtered.map((item: { name: string }) => {
            const classes = [];
            if (selectedValue === item.name) classes.push("selected");
            return (
              <li
                key={item.name}
                onClick={() => setSelectedItem(item.name)}
                className={classes.join(" ")}
              >
                <span>{item.name}</span>
              </li>
            );
          })}
        </ul>
      </div>,
      document.body
    );
  };

  const ignoreKeyboard = (event: React.KeyboardEvent<HTMLSelectElement>) => {
    event.preventDefault();
  };

  return (
    <div
      data-testid={props.testId}
      tabIndex={0}
      className={"select-container" + (props.fit ? " fit" : "")}
      ref={setContainer}
      onMouseDown={showDropdown}
    >
      <select
        value={props.value}
        className={"select" + (props.value === "" ? " no-selection" : "")}
        disabled={props.disabled}
        onChange={onChange}
        onKeyPressCapture={ignoreKeyboard}
        onKeyDownCapture={ignoreKeyboard}
        onKeyUpCapture={ignoreKeyboard}
      >
        {props.empty ? (
          <option value={""} disabled={true}>
            {props.empty}
          </option>
        ) : null}
        {filtered.map((item: { name: string }) => (
          <option key={item.name} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
      <div className={"arrow" + (props.value === "" ? " no-selection" : "")}>
        <i className={"fa fa-caret-down"} />
      </div>
      {renderDropdown()}
    </div>
  );
};
