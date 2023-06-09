import { FormControl, FormHelperText, FormLabel, Grid, OutlinedInput } from '@material-ui/core';
import { PresetSizeButton } from 'components/presetSizeButton';
import { useTicketClasses } from 'hooks/useTicketClasses';
import strings from 'locales';
import React, { ReactElement, useState } from 'react';
import { OrderTypes } from 'types/mdEntry';
import { Order } from 'types/order';
import { selectInputText } from 'utils/commonUtils';
import { sizeFormatter } from 'utils/sizeFormatter';

interface Props {
  readonly order: Order;
  readonly minimumSize: number;
  readonly onSubmit: (order: Order) => void;
  readonly onCancel: () => void;
}

const formatValue = (value: number | null, precision: number): string =>
  value === null ? '' : value.toFixed(precision);

const OrderTicket: React.FC<Props> = (props: Props): ReactElement | null => {
  const { order } = props;
  const [size, setSize] = useState<number | null>(order.size);
  const [price, setPrice] = useState<string>(formatValue(order.price, 3));
  const classes = useTicketClasses();
  const priceError = React.useMemo(
    (): string | null => (isNaN(Number(price)) ? 'Invalid value' : null),
    [price]
  );
  if (!order) return null;
  const updateQuantity = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>): void => {
    const numeric = Number(value);
    if (isNaN(numeric)) {
      return;
    }
    setSize(numeric);
  };
  const updatePrice = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>): void => {
    setPrice(value);
  };

  const onSubmit = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    if (size !== null && price !== null) {
      props.onSubmit({
        ...order,
        size: Number(size),
        price: Number(price),
      });
    }
  };
  const canSubmit: boolean = price !== null && size !== null && size >= props.minimumSize;
  const presetSizes: number[] = [30, 50, 100];
  return (
    <>
      <div className="title-chain modal-title">
        <div className="title">
          <div className="item">{order.symbol}</div>
          <div className="item">{order.tenor}</div>
          <div className="item">{order.strategy}</div>
        </div>
        <div className="subtitle">
          <span>{order.type === OrderTypes.Bid ? 'Buy' : 'Sell'}</span>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div className="ticket">
          <Grid>
            <FormControl className={classes.formControl}>
              <FormLabel htmlFor="price">Vol</FormLabel>
              <OutlinedInput
                id="price"
                value={price}
                onChange={updatePrice}
                labelWidth={0}
                className={classes.outlinedInput}
              />
              <FormHelperText error={priceError !== null}>{priceError}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid>
            <FormControl className={classes.formControl}>
              <FormLabel htmlFor="size">Amt</FormLabel>
              <OutlinedInput
                id="size"
                value={sizeFormatter(size)}
                inputRef={selectInputText}
                labelWidth={0}
                onChange={updateQuantity}
                autoFocus={true}
                className={classes.outlinedInput}
              />
              <div className="preset-buttons three">
                {presetSizes.map((value: number) => (
                  <PresetSizeButton key={value} value={value} setValue={setSize} />
                ))}
              </div>
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
    </>
  );
};

export { OrderTicket };
