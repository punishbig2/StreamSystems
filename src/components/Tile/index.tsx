import {Buttons} from 'components/Tile/buttons';
import {StyledSelect} from 'components/Tile/styledSelect';
import {TitleBar} from 'components/Tile/titleBar';
import {Product} from 'interfaces/product';
import React, {ReactElement, useEffect} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {Action, Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRActions';
import {TileActions} from 'redux/constants/tileConstants';
import {TileState} from 'redux/stateDefs/tileState';
import {WSAction} from 'redux/wsAction';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  tenors: string[],
  products: Product[];
  symbols: string[];
}

export const subscribe = (symbol: string, product: string, tenor: string): WSAction<TileActions> => {
  return new WSAction(SignalRActions.Subscribe, [symbol, product, tenor]);
};

interface DispatchProps {
  subscribe: typeof subscribe,
  setProduct: (value: string) => Action,
  setSymbol: (value: string) => Action,
}

// FIXME: this could probably be extracted to a generic function
const mapStateToProps: MapStateToProps<TileState, OwnProps, ApplicationState> =
  (state: ApplicationState, ownProps: OwnProps): TileState => {
    const generalizedState = state as any;
    if (generalizedState.hasOwnProperty(ownProps.id)) {
      // Forcing typescript to listen to me >(
      return generalizedState[ownProps.id] as TileState;
    } else {
      return {} as TileState;
    }
  };

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  subscribe: (symbol: string, product: string, tenor: string) => dispatch(subscribe(symbol, product, tenor)),
  setProduct: (value: string): Action => dispatch(createAction($$(id, TileActions.SetProduct), value)),
  setSymbol: (value: string): Action => dispatch(createAction($$(id, TileActions.SetSymbol), value)),
});

const withRedux: (ignored: any) => any = connect<TileState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & TileState;
export const Title: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
  const {symbols, products, subscribe, tenors} = props;
  // TOB keys
  const {symbol, product} = props;
  const setProduct = ({target: {value}}: { target: HTMLSelectElement }) => props.setProduct(value);
  const setSymbol = ({target: {value}}: { target: HTMLSelectElement }) => props.setSymbol(value);
  useEffect(() => {
    if (symbol === undefined || product === undefined)
      return;
    console.log(tenors);
    tenors.forEach((tenor: string) => {
      // FIXME: this is ridiculous, there's a check above for both against undefined
      subscribe(symbol, product, tenor);
    });
  }, [symbol, product, tenors, subscribe]);
  return (
    <TitleBar>
      <StyledSelect onMouseDownCapture={() => null} value={symbol} onChange={setSymbol}>
        <option value={''}>Choose one</option>
        {symbols.map((item: string) => <option value={item} key={item}>{item}</option>)}
      </StyledSelect>
      <StyledSelect onMouseDownCapture={() => null} value={product} onChange={setProduct}>
        <option value={''}>Choose one</option>
        {products.map((item: Product) => <option value={item.name} key={item.name}>{item.name}</option>)}
      </StyledSelect>
      <Buttons>
        <button><i className={'fa fa-window-minimize'}/></button>
        <button><i className={'fa fa-window-restore'}/></button>
        <button><i className={'fa fa-window-close'}/></button>
      </Buttons>
    </TitleBar>
  );
});
