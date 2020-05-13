import { Currency } from 'interfaces/currency';
import React, { useState, ReactElement, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface OwnProps {
  list: any[];
  value: any;
  empty?: string;
  searchable?: boolean;
  fit?: boolean;
  onChange: (value: string) => void;
}

export const Select: React.FC<OwnProps> = (props: OwnProps) => {
  const { list, value } = props;
  const [isDropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [position, setPosition] = useState<ClientRect>(new DOMRect());
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [keyword, setKeyword] = useState<string>('');
  const [dropdown, setDropdown] = useState<HTMLUListElement | null>(null);
  const [currentItem, setCurrentItem] = useState<number>(0);

  const onChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const { currentTarget } = event;
    props.onChange(currentTarget.value);
  };

  const showDropdown = (event: React.FormEvent<HTMLElement>) => {
    if (isDropdownVisible)
      return;
    event.preventDefault();
    event.stopPropagation();
    // Show the dropdown now
    setDropdownVisible(true);
    // Get the geometry to locate the dropdown
    if (container !== null) {
      const boundingBox: ClientRect = container.getBoundingClientRect();
      setPosition(new DOMRect(boundingBox.left - 4, boundingBox.bottom, boundingBox.width + 8, -1));
    }
  };

  const setInput = (input: HTMLInputElement | null) => {
    if (input === null)
      return;
    input.focus();
  };

  const positionToStyle = (position: ClientRect) => {
    return {
      top: `${position.top}px`,
      width: `${position.width}px`,
      left: `${position.left}px`,
      height: 'auto',
    };
  };

  useEffect(() => {
    if (!isDropdownVisible || dropdown === null)
      return;
    const isChildOf = (parent: HTMLElement | ChildNode, child: HTMLElement | null): boolean => {
      if (child === null)
        return false;
      const array: ChildNode[] = Array.from(parent.childNodes);
      if (array.includes(child))
        return true;
      return array.some((next: ChildNode) => isChildOf(next, child));
    };
    const onClickOutside = ({ target }: MouseEvent) => {
      if (target === dropdown || isChildOf(dropdown, target as HTMLElement))
        return;
      setDropdownVisible(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isDropdownVisible, dropdown]);

  useEffect(() => {
    setCurrentItem(list.findIndex((item: { name: string }) => item.name === value));
  }, [value, list]);

  const filtered: any[] = list.filter(({ name }: { name: string }) => {
    const lowerName: string = name.toLowerCase();
    if (keyword.trim() === '')
      return true;
    return lowerName.startsWith(keyword.toLowerCase());
  });

  const updateKeyword = (event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setKeyword(value);
    setCurrentItem(0);
  };

  const onItemClick = (value: string) => {
    setDropdownVisible(false);
    props.onChange(value);
  };

  const renderDropdown = (): ReactElement | null => {
    if (!isDropdownVisible)
      return null;

    const swallowMouse = (event: React.MouseEvent<HTMLUListElement>) => {
      event.stopPropagation();
      event.preventDefault();
    };

    const moveCursor = (event: React.KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();
      switch (event.key) {
        case 'ArrowUp':
          if (currentItem === 0) {
            setCurrentItem(filtered.length - 1);
          } else {
            setCurrentItem(currentItem - 1);
          }
          break;
        case 'ArrowDown':
          if (currentItem === filtered.length - 1) {
            setCurrentItem(0);
          } else {
            setCurrentItem(currentItem + 1);
          }
          break;
        case 'Enter':
          onItemClick(list[currentItem].name);
          break;
        case 'Escape':
          setDropdownVisible(false);
          break;
      }
    };

    const searchBox: ReactElement = (
      <li>
        <input ref={setInput} placeholder={'Search'} value={keyword} onChange={updateKeyword} onKeyDown={moveCursor}/>
      </li>
    );
    return ReactDOM.createPortal(
      <ul className={'dropdown'} style={positionToStyle(position)} onMouseDownCapture={swallowMouse} ref={setDropdown}>
        {props.searchable && searchBox}
        {filtered.map((item: { name: string }, index: number) => {
          const classes = [];
          if (currentItem === index)
            classes.push('selected');
          return (
            <li key={item.name} onClick={() => onItemClick(item.name)} className={classes.join(' ')}>
              <span>{item.name}</span>
            </li>
          );
        })}
      </ul>, document.body);
  };

  const ignoreKeyboard = (event: React.KeyboardEvent<HTMLSelectElement>) => {
    event.preventDefault();
  };

  return (
    <div className={'select-container' + (props.fit ? ' fit' : '')} ref={setContainer} onMouseDown={showDropdown}>
      <select value={props.value}
              className={'select' + (props.value === '' ? ' no-selection' : '')}
              onChange={onChange}
              onKeyPressCapture={ignoreKeyboard}
              onKeyDownCapture={ignoreKeyboard}
              onKeyUpCapture={ignoreKeyboard}>
        {props.empty ? <option value={''} disabled={true}>{props.empty}</option> : null}
        {filtered.map((item: Currency) => (
          <option key={item.name} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
      <div className={'arrow' + (props.value === '' ? ' no-selection' : '')}>
        <i className={'fa fa-caret-down'}/>
      </div>
      {renderDropdown()}
    </div>
  );
};

Select.defaultProps = {
  fit: false,
};

