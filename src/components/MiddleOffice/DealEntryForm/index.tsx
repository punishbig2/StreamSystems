import { Grid } from "@material-ui/core";
import { FormField } from "components/formField";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { observer } from "mobx-react";
import mo from "mobx/stores/moStore";
import moStore, { MoStore } from "mobx/stores/moStore";
import { FieldDef, SelectItem } from "forms/fieldDef";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { API, HTTPError } from "API";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";
import { DealEntryStore, EntryType } from "mobx/stores/dealEntryStore";
import { ExistingEntryButtons } from "components/MiddleOffice/DealEntryForm/existingEntryButtons";
import { NewEntryButtons } from "components/MiddleOffice/DealEntryForm/newEntryButtons";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import existingEntryFields from "components/MiddleOffice/DealEntryForm/existingEntryFields";
import newEntryFields from "components/MiddleOffice/DealEntryForm/newEntryFields";

interface Props {
  store: DealEntryStore;
}

const sendPricingRequest = (deal: Deal, entry: DealEntry): void => {
  if (deal === null || entry === null)
    throw new Error("no deal to get a pricing for");
  if (deal.strategy === undefined) throw new Error("invalid deal found");
  if (entry.model === "") throw new Error("node model specified");
  const valuationModel: ValuationModel = mo.getValuationModelById(
    entry.model as number
  );
  const strategy: MOStrategy = mo.getStrategyById(deal.strategy);
  mo.setSendingPricingRequest(true);
  API.sendPricingRequest(deal, entry, mo.legs, valuationModel, strategy)
    .then(() => {})
    .catch((error: HTTPError) => {
      if (error !== undefined) {
        const message: string = error.getMessage();
        moStore.setError({
          code: error.getCode(),
          ...JSON.parse(message),
        });
      }
      console.log("an error just happened", error);
    })
    .finally(() => {
      mo.setSendingPricingRequest(false);
    });
};

export const DealEntryForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { store } = props;
    const { cuts, deal } = mo;
    const { entry } = store;

    useLegs(cuts, deal);

    const onPriced =
      deal === null ? undefined : () => sendPricingRequest(deal, entry);
    const mapper = (
      fieldDef: FieldDef<DealEntry, MoStore>,
      index: number
    ): ReactElement | null => {
      const { transformData, dataSource, ...field } = fieldDef;
      const source: any = !!dataSource ? mo[dataSource] : undefined;
      const data: SelectItem[] = !!transformData ? transformData(source) : [];
      const value: any = !!entry ? entry[field.name] : null;
      const onChange = (name: keyof DealEntry, value: string) => {
        const convertedValue: any = (() => {
          if (field.type === "number") {
            if (value.length === 0) return null;
            const candidate: number = Number(value.replaceAll(/[,.]*/g, ""));
            if (isNaN(candidate)) {
              return undefined;
            }
            return candidate;
          } else {
            return value;
          }
        })();
        // Ignore it!
        if (convertedValue === undefined) return;
        store.updateEntry(name, convertedValue);
      };
      return (
        <FormField
          key={field.name + index}
          {...field}
          formData={entry}
          data={data}
          onChange={onChange}
          value={value}
        />
      );
    };

    const createOrClone = () => {
      const {
        buyer,
        seller,
        strategy,
        currencyPair,
        model,
        vol,
        notional,
      } = store.entry;
      if (notional === null || notional === undefined)
        throw new Error("notional must be set");
      const price: number | null | undefined =
        entry.vol !== null ? entry.vol : entry.spread;
      if (price === null || price === undefined)
        throw new Error("vol or spread must be set");
      switch (store.entryType) {
        case EntryType.Empty:
        case EntryType.ExistingDeal:
          throw new Error(
            "this function should not be called in current state"
          );
        case EntryType.New:
          API.createDeal({
            buyer: buyer,
            seller: seller,
            strategy: strategy,
            symbol: currencyPair,
            model: model,
            price: price.toString(),
            size: Math.round(notional / 1e6).toString(),
          })
            .then(() => {
              moStore.setDeal(null, store);
            })
            .catch((reason: any) => {
              console.warn(reason);
            });
          break;
        case EntryType.Clone:
          API.cloneDeal({
            buyer: buyer,
            seller: seller,
            strategy: strategy,
            symbol: currencyPair,
            model: model,
            price: price.toString(),
            size: Math.round(notional / 1e6).toString(),
          })
            .then(() => {
              moStore.setDeal(null, store);
            })
            .catch((reason: any) => {
              console.warn(reason);
            });
          break;
      }
    };

    const getActionButtons = (): ReactElement | null => {
      switch (store.entryType) {
        case EntryType.Empty:
          return null;
        case EntryType.ExistingDeal:
          return (
            <ExistingEntryButtons
              isModified={store.isModified}
              isPriced={false}
              onPriced={onPriced}
            />
          );
        case EntryType.New:
        case EntryType.Clone:
          return (
            <NewEntryButtons
              onCancelled={() => moStore.setDeal(null, store)}
              onSubmitted={createOrClone}
              canSubmit={store.isReadyForSubmission}
            />
          );
      }
    };

    const fields =
      store.entryType === EntryType.New || store.entryType === EntryType.Clone
        ? newEntryFields
        : existingEntryFields;
    return (
      <form
        className={
          store.entryType === EntryType.Empty ? "invisible" : undefined
        }
      >
        <Grid alignItems={"stretch"} container>
          <Grid xs={12} item>
            <fieldset className={"full-height"}>{fields.map(mapper)}</fieldset>
          </Grid>
        </Grid>
        <div className={"button-box"}>{getActionButtons()}</div>
      </form>
    );
  }
);

