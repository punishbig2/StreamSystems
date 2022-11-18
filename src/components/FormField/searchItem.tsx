import { MenuItem, OutlinedInput } from '@material-ui/core';
import React, { useEffect, useState } from 'react';

const classes = {
  item: {
    root: 'select-search-item-root',
  },
  search: {
    root: 'select-search-root',
    notchedOutline: 'select-search-outline',
    input: 'select-search-input',
  },
};

interface Props {
  readonly onSelectNext: () => void;
  readonly onSelectPrev: () => void;
  readonly onChange: (value: string) => void;
}

const ignoreClick = (event: React.MouseEvent<HTMLLIElement>): void => {
  event.preventDefault();
  event.stopPropagation();
};

export const SearchItem: React.FC<Props> = React.forwardRef(
  (props: Props, ref: React.Ref<any>): React.ReactElement => {
    const [filterValue, setFilterValue] = useState<string>('');
    const { onChange: propsOnChange } = props;
    const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
      const { value } = event.target;
      setFilterValue(value);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLLIElement>): void => {
      switch (event.key) {
        case 'Escape':
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
          break;
        default:
          event.stopPropagation();
      }
    };

    useEffect(() => {
      const timeout = setTimeout(() => {
        propsOnChange(filterValue);
      }, 300);
      return () => clearTimeout(timeout);
    }, [propsOnChange, filterValue]);

    return (
      <MenuItem
        classes={classes.item}
        disableRipple={true}
        className="search-item"
        onKeyDownCapture={onKeyDown}
        onClickCapture={ignoreClick}
      >
        <OutlinedInput
          value={filterValue}
          classes={classes.search}
          labelWidth={0}
          placeholder="Type to filter"
          autoFocus={true}
          onChange={onChange}
        />
      </MenuItem>
    );
  }
);
