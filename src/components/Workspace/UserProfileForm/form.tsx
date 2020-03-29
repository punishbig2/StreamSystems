import React, {ChangeEvent, FormEvent, ReactNode, useState, useEffect} from 'react';
import strings from 'locales';
import Grid from '@material-ui/core/Grid';
import {FormControl, FormLabel, Select, MenuItem, Input} from '@material-ui/core';
import {CurrencyGroups, UserWorkspace, ExecSound, OCOModes, User} from 'interfaces/user';
import timezones, {TimezoneInfo} from 'data/timezones';
import deepEqual from 'deep-equal';
import {getSoundsList, addSound} from 'beep-sound';
import {getAuthenticatedUser} from 'utils/getCurrentUser';

interface OwnProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onChange: (event: ChangeEvent<any>) => void;
  profile: UserWorkspace;
  original: UserWorkspace | null;
}

declare var GlobalApplicationVersion: string;
if (GlobalApplicationVersion === undefined)
  GlobalApplicationVersion = 'Unknown';

const SoundEntry: React.FC<ExecSound> = (props: ExecSound) => {
  const displayName: string = ((name: string) => {
    return name.replace(/\.[^.]+$/, '');
  })(props.name);
  const onDelete = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <MenuItem key={props.name} value={props.name}>
      <div className={'sound-item'}>
        <div className={'label'}>{displayName}</div>
        <div className={'delete-button'}>
          <i className={'far fa-trash-alt'} onClick={onDelete}/>
        </div>
      </div>
    </MenuItem>
  );
};

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
  const [sounds, setSounds] = useState<ExecSound[]>([]);

  useEffect(() => {
    getSoundsList().then(setSounds);
  }, []);

  const hasNotChanged = () => {
    if (props.original === null)
      return false;
    return deepEqual(profile, props.original);
  };

  const onExecSoundChange = (event: any) => {
    const {value} = event.target;
    if (value === 'add') {
      const input: HTMLInputElement = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'audio/*');
      input.click();
      input.onchange = () => {
        if (input.files) {
          const file: File = input.files[0];
          const reader: FileReader = new FileReader();
          reader.onload = () => {
            if (reader.result !== null) {
              const newFile: ExecSound = {
                data: reader.result,
                name: file.name,
              };
              addSound(newFile);
            }
          };
          if (file) {
            reader.readAsDataURL(file);
          }
        }
      };
    } else {
      props.onChange(event);
    }
  };

  const formatTimezone = (text: string): string => {
    return text.replace(/_/g, ' ');
  };

  const user: User = getAuthenticatedUser();
  const userType: string = user.isbroker ? 'Broker' : 'Bank';
  return (
    <>
      <div className={'modal-title'}>
        <div>{strings.UserProfile}</div>
        <small>FX Options {GlobalApplicationVersion}</small>
      </div>
      <form className={'user-profile-form'} name={'user-profile'} onSubmit={props.onSubmit} autoComplete={'off'}
            noValidate>
        <Grid container direction={'column'}>
          <Grid item container spacing={2} direction={'row'}>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'user-type'}>User Type</FormLabel>
                <Input value={userType} readOnly={true}/>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'mpid'}>MPID</FormLabel>
                <Input value={user.firm} readOnly={true}/>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'oco'}>OCO</FormLabel>
                <Select id={'oco'} onChange={props.onChange} name={'oco'} value={profile.oco}>
                  <MenuItem value={OCOModes.Disabled}>Disabled</MenuItem>
                  <MenuItem value={OCOModes.PartialEx}>Partial Ex.</MenuItem>
                  <MenuItem value={OCOModes.FullEx}>Full Ex.</MenuItem>
                </Select>
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
                  onChange={onExecSoundChange}
                  name={'execSound'}
                  value={profile.execSound}>
                  <MenuItem value={'default'}>Default</MenuItem>
                  {sounds.map((item: ExecSound) => <SoundEntry {...item}/>)}
                  <MenuItem key={'add-item-key'} value={'add'}>
                    Add New
                  </MenuItem>
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
                    {formatTimezone(zone.text)}
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
