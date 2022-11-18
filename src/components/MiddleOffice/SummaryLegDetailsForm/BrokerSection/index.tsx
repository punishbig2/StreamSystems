import { Grid } from '@material-ui/core';
import { Field } from 'components/MiddleOffice/SummaryLegDetailsForm/BrokerSection/field';
import { fields } from 'components/MiddleOffice/SummaryLegDetailsForm/BrokerSection/fields';
import { FieldDef } from 'forms/fieldDef';
import React, { ReactElement, useMemo } from 'react';
import { BrokerageCommission } from 'types/brokerageCommission';

interface Props {
  readonly disabled: boolean;
  readonly buyerComm: number | null;
  readonly buyerCommRate: number | null;
  readonly sellerComm: number | null;
  readonly sellerCommRate: number | null;
  readonly onUpdateCommission: (value: BrokerageCommission) => Promise<void>;
}

export const BrokerSection: React.FC<Props> = (props: Props): React.ReactElement<Props> => {
  const { buyerComm, buyerCommRate, sellerComm, sellerCommRate } = props;
  const value: BrokerageCommission = useMemo(
    (): BrokerageCommission => ({
      buyer_comm_rate: buyerCommRate,
      buyer_comm: buyerComm,
      seller_comm_rate: sellerCommRate,
      seller_comm: sellerComm,
      total: buyerComm === null || sellerComm === null ? null : buyerComm + sellerComm,
    }),
    [buyerComm, buyerCommRate, sellerComm, sellerCommRate]
  );

  return (
    <Grid alignItems="stretch" container>
      <fieldset className="group" disabled={props.disabled}>
        <legend>Brokerage</legend>
        {fields.map(
          (fieldDef: FieldDef<BrokerageCommission, BrokerageCommission>): ReactElement => {
            return (
              <Field
                key={fieldDef.name}
                {...fieldDef}
                value={value}
                disabled={props.disabled}
                onChange={props.onUpdateCommission}
              />
            );
          }
        )}
      </fieldset>
    </Grid>
  );
};
