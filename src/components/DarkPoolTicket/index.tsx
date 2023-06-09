import {
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  MenuItem,
  OutlinedInput,
  Select,
} from '@material-ui/core';
import { PresetSizeButton } from 'components/presetSizeButton';
import { useTicketClasses } from 'hooks/useTicketClasses';
import strings from 'locales';
import workareaStore from 'mobx/stores/workareaStore';
import React, { useState } from 'react';
import { DarkPoolOrder } from 'types/order';
import { SelectEventData } from 'types/selectEventData';
import { Sides } from 'types/sides';
import { User } from 'types/user';
import { MessageTypes } from 'types/w';
import { selectInputText } from 'utils/commonUtils';
import { priceFormatter } from 'utils/priceFormatter';
import { sizeFormatter } from 'utils/sizeFormatter';

interface OwnProps {
  tenor: string;
  symbol: string;
  strategy: string;
  price: number;
  minimumSize: number;
  onCancel: () => void;
  onSubmit: (order: DarkPoolOrder) => void;
}

const None = '';
const presetSizes: number[] = [30, 50, 100, 500];

const DarkPoolTicket: React.FC<OwnProps> = (props: OwnProps) => {
  const [price, setPrice] = useState<number>(props.price);
  const [size, setSize] = useState<number>(props.minimumSize);
  const [side, setSide] = useState<string>(None);
  const [inst, setInst] = useState<string>(None);
  const classes = useTicketClasses();
  const updateSize = ({ currentTarget }: React.ChangeEvent<HTMLInputElement>): void => {
    const numeric = Number(currentTarget.value);
    if (isNaN(numeric)) return;
    setSize(numeric);
  };

  const updatePrice = ({ currentTarget }: React.ChangeEvent<HTMLInputElement>): void => {
    const numeric = Number(currentTarget.value);
    if (isNaN(numeric)) {
      return;
    }
    setPrice(numeric);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const user: User = workareaStore.user;
    const order: DarkPoolOrder = {
      ExecInst: inst === None ? undefined : inst,
      MsgType: MessageTypes.D,
      Price: priceFormatter(price),
      Quantity: sizeFormatter(size),
      Side: side as Sides,
      Strategy: props.strategy,
      Symbol: props.symbol,
      Tenor: props.tenor,
      TransactTime: (Date.now() / 1000).toFixed(0),
      User: user.email,
      Firm: workareaStore.effectiveFirm,
    };
    props.onSubmit(order);
  };

  const instLabels: { [key: string]: string } = { G: 'AON', D: '1/2 ON' };
  const sideLabels: { [key: string]: string } = { SELL: 'Sell', BUY: 'Buy' };
  const canSubmit: boolean = !isNaN(Number(price)) && side !== '' && size >= props.minimumSize;

  const renderSide = (value: any): React.ReactElement | string =>
    !value ? <span className="invalid">Select side&hellip;</span> : sideLabels[value as string];
  const stringSelectSetter =
    (fn: (value: string) => void) => (event: React.ChangeEvent<SelectEventData>) => {
      const { value } = event.target;
      fn(value as string);
    };
  const error = size < props.minimumSize ? 'Minimum Qty: ' + props.minimumSize : ' ';
  return (
    <div>
      <div className="modal-title">
        <div className="title-chain modal-title">
          <div className="title">
            <div className="item">{props.symbol}</div>
            <div className="item">{props.tenor}</div>
            <div className="item">{props.strategy}</div>
          </div>
          <div className="subtitle">{strings.DarkPool}</div>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div className="ticket">
          <Grid>
            <FormControl className={classes.formControl}>
              <FormLabel htmlFor="side">Side</FormLabel>
              <Select
                id="side"
                disabled={!workareaStore.connected}
                value={side}
                displayEmpty={true}
                renderValue={renderSide}
                variant="outlined"
                className={classes.select}
                onChange={stringSelectSetter((value: string) => setSide(value))}
              >
                <MenuItem value="BUY">Buy</MenuItem>
                <MenuItem value="SELL">Sell</MenuItem>
              </Select>
              <FormHelperText error={true} className={classes.formHelperText}>
                {side === '' ? 'Please choose a side' : ' '}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid>
            <FormControl className={classes.formControl}>
              <FormLabel htmlFor="price">Vol</FormLabel>
              <OutlinedInput
                className={classes.outlinedInput}
                id="price"
                value={priceFormatter(price)}
                onChange={updatePrice}
                labelWidth={0}
                readOnly
              />
              <FormHelperText error={true}>
                {isNaN(price) ? 'Invalid price value' : ' '}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid>
            <FormControl className={classes.formControl}>
              <FormLabel htmlFor="size">Qty</FormLabel>
              <OutlinedInput
                className={classes.outlinedInput}
                value={size}
                onChange={updateSize}
                labelWidth={0}
                inputRef={selectInputText}
                autoFocus={true}
              />
              <FormHelperText error={true} className={classes.formHelperText}>
                {error}
              </FormHelperText>
              <div className="preset-buttons four">
                {presetSizes.map((value: number) => (
                  <PresetSizeButton key={value} value={value} setValue={setSize} />
                ))}
              </div>
            </FormControl>
          </Grid>
          <Grid>
            <FormControl className={classes.formControl}>
              <FormLabel htmlFor="inst">Instructions</FormLabel>
              <Select
                id="inst"
                value={inst}
                displayEmpty={true}
                renderValue={(value: any) => (!value ? 'None' : instLabels[value as string])}
                variant="outlined"
                className={classes.select}
                disabled={true}
                onChange={stringSelectSetter((value: string) => setInst(value))}
              >
                <MenuItem value="G">AON</MenuItem>
                <MenuItem value="D">
                  <sup>1</sup>/<sub>2</sub>&nbsp;ON
                </MenuItem>
              </Select>
              <FormHelperText error={true} className={classes.formHelperText}>
                {' '}
              </FormHelperText>
            </FormControl>
          </Grid>
        </div>
        <div className="modal-buttons">
          <button type="button" className="cancel" onClick={props.onCancel}>
            {strings.Cancel}
          </button>
          <button className="success" disabled={!canSubmit}>
            {strings.Submit}
          </button>
        </div>
      </form>
    </div>
  );
};

export { DarkPoolTicket };
