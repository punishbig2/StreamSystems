import React, {ChangeEvent, FormEvent, ReactNode} from 'react';
import strings from 'locales';
import Grid from '@material-ui/core/Grid';
import {FormControl, FormLabel, Select, MenuItem, Input, FormControlLabel, Checkbox} from '@material-ui/core';
import {UserTypes, CurrencyGroups, UserProfile} from 'interfaces/user';
import timezones, {TimezoneInfo} from 'data/timezones';
import deepEqual from 'deep-equal';
import moment from 'moment';

interface OwnProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onChange: (event: ChangeEvent<any>) => void;
  profile: UserProfile;
  original: UserProfile | null;
}

const renderTimezone = (value: unknown): ReactNode => {
  if (value === '')
    return <span className={'disabled-item'}>{strings.TimezoneUnset}</span>;
  return value as string;
};

const renderCCYGroup = (value: unknown): ReactNode => {
  if (value === '')
    return <span className={'disabled-item'}>{strings.CCYGroupUnset}</span>;
  return value as string;
};

export const UserProfileForm: React.FC<OwnProps> = (props: OwnProps) => {
  const {profile} = props;

  const hasNotChanged = () => {
    if (props.original === null)
      return false;
    return deepEqual(profile, props.original);
  };

  const wasModifiedToday = (timestamp: number | null, timezone: string) => {
    if (timestamp === null)
      return false;
    const tz: TimezoneInfo | undefined = timezones.find((tz: TimezoneInfo) => tz.text === timezone);
    if (tz) {
      const when: moment.Moment = moment
        // Get the time from unix timestamp in seconds (hence divide by 1000)
        .unix(Math.floor(timestamp / 1000))
        // Add the timezone offset
        .add(tz.offset, 'h')
      return when.isSame(new Date(), 'd');
    }
    return false;
  };

  return (
    <>
      <div className={'modal-title'}>{strings.UserProfile}</div>
      <form className={'user-profile-form'} name={'user-profile'} onSubmit={props.onSubmit} autoComplete={'off'}
            noValidate>
        <Grid container direction={'column'}>
          <Grid item container spacing={2} direction={'row'}>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'user-type'}>User Type</FormLabel>
                <Select
                  id={'user-type'}
                  onChange={props.onChange}
                  name={'userType'}
                  value={profile.userType}>
                  <MenuItem value={UserTypes.Bank}>Bank</MenuItem>
                  <MenuItem value={UserTypes.Broker}>Broker</MenuItem>
                  <MenuItem value={UserTypes.MarketMaker}>
                    Market Maker
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'mpid'}>MPID</FormLabel>
                <Input
                  id={'mpid'}
                  onChange={props.onChange}
                  name={'mpid'}
                  value={profile.mpid}
                />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={'normal'}>
                <FormLabel htmlFor={'oco'}>OCO</FormLabel>
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={wasModifiedToday(profile.lastOCOUpdateTimestamp, profile.timezone)}
                      id={'oco'}
                      checked={profile.oco}
                      name={'oco'}
                      onChange={props.onChange}/>
                  }
                  label={'Enabled'}/>
              </FormControl>
            </Grid>
          </Grid>

          <Grid item container spacing={2} direction={'row'}>
            <Grid item xs={6}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'font'}>Font</FormLabel>
                <Select
                  id={'font'}
                  onChange={props.onChange}
                  name={'font'}
                  value={profile.font}>
                  <MenuItem value={'default'}>Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'font-size'}>Font Size</FormLabel>
                <Select
                  id={'font-size'}
                  onChange={props.onChange}
                  name={'fontSize'}
                  value={profile.fontSize}>
                  <MenuItem value={'12px'}>12px</MenuItem>
                  <MenuItem value={'13px'}>13px</MenuItem>
                  <MenuItem value={'14px'}>14px</MenuItem>
                  <MenuItem value={'15px'}>15px</MenuItem>
                  <MenuItem value={'16px'}>16px</MenuItem>
                  <MenuItem value={'17px'}>17px</MenuItem>
                  <MenuItem value={'18px'}>18px</MenuItem>
                  <MenuItem value={'19px'}>19px</MenuItem>
                  <MenuItem value={'20px'}>20px</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'exec-sound'}>Exec Sound</FormLabel>
                <Select
                  id={'exec-sound'}
                  onChange={props.onChange}
                  name={'execSound'}
                  value={profile.execSound}>
                  <MenuItem value={'default'}>Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid item>
            <FormControl margin={'normal'} fullWidth>
              <FormLabel htmlFor={'ccy-group'}>CCY Group</FormLabel>
              <Select
                id={'ccy-group'}
                onChange={props.onChange}
                name={'ccyGroup'}
                value={profile.ccyGroup}
                displayEmpty={true}
                renderValue={renderCCYGroup}>
                <MenuItem value={CurrencyGroups.G10}>
                  {CurrencyGroups.G10}
                </MenuItem>
                <MenuItem value={CurrencyGroups.Asia}>
                  {CurrencyGroups.Asia}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl margin={'normal'} fullWidth>
              <FormLabel htmlFor={'time-zone'}>Time Zone</FormLabel>
              <Select
                id={'time-zone'}
                onChange={props.onChange}
                name={'timezone'}
                value={profile.timezone}
                displayEmpty
                renderValue={renderTimezone}>
                {timezones.map((zone: TimezoneInfo) => (
                  <MenuItem key={zone.text} value={zone.text}>
                    {zone.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl fullWidth>
              <FormLabel>Workspace</FormLabel>
              <h4 className={'no-content'}>No content</h4>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl fullWidth margin={'normal'}>
              <FormLabel htmlFor={'color-scheme'}>Color Scheme</FormLabel>
              <Select
                id={'color-scheme'}
                onChange={props.onChange}
                name={'colorScheme'}
                value={profile.colorScheme}>
                <MenuItem value={'default'}>Default</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <div className={'modal-buttons'}>
          <button className={'cancel'} onClick={props.onCancel} type={'button'}>
            {strings.Cancel}
          </button>
          <button className={'success'} type={'submit'} disabled={hasNotChanged()}>
            {strings.Save}
          </button>
        </div>
      </form>
    </>
  );
};
