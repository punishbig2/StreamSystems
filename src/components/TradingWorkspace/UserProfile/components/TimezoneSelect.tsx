import { Box, Input, MenuItem, Select } from '@material-ui/core';
import timezones, { TimezoneInfo } from 'data/timezones';
import strings from 'locales';
import workareaStore from 'mobx/stores/workareaStore';
import React, { ChangeEvent, ReactNode, useCallback, useEffect, useState } from 'react';

interface Props {
  readonly value: string;
  readonly id: string;
  readonly name: string;

  onChange(event: ChangeEvent<any>): void;
}

export const TimezoneSelect: React.FC<Props> = (props: Props): React.ReactElement => {
  const [keyword, setKeyword] = useState<string>('');
  const [data, setData] = useState<readonly TimezoneInfo[]>(timezones);

  const onKeywordChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    setKeyword(value);
  }, []);

  const stopEvent = useCallback((event: React.SyntheticEvent): void => {
    event.stopPropagation();
  }, []);

  useEffect((): void | VoidFunction => {
    const searchTerm = keyword.toLowerCase();

    const timeout = setTimeout(
      (): void =>
        setData(
          timezones.filter((item: TimezoneInfo): boolean => {
            const { text } = item;
            const searchedText = text.toLowerCase();
            return searchedText.includes(searchTerm);
          })
        ),
      350
    );

    return (): void => {
      clearTimeout(timeout);
    };
  }, [keyword]);

  return (
    <Select
      id={props.id}
      name={props.name}
      disabled={!workareaStore.connected}
      value={props.value}
      displayEmpty={true}
      renderValue={renderTimezone}
      onChange={props.onChange}
    >
      <Box className="dropdown-search-box">
        <Input
          classes={{ root: 'dropdown-search-box-input' }}
          placeholder={'Search'}
          fullWidth={true}
          value={keyword}
          onKeyDown={stopEvent}
          onClick={stopEvent}
          onChange={onKeywordChange}
        />
      </Box>

      {data.map(
        (zone: TimezoneInfo): React.ReactElement => (
          <MenuItem key={zone.text} value={zone.text}>
            {formatTimezone(zone.text)}
          </MenuItem>
        )
      )}
    </Select>
  );
};

const renderTimezone = (value: unknown): ReactNode => {
  if (typeof value !== 'string' || value === '')
    return <span className="disabled-item">{strings.TimezoneUnset}</span>;

  return formatTimezone(value);
};

const formatTimezone = (text: string): string => {
  return text.replace(/_/g, ' ');
};
