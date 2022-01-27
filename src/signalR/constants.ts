export enum Methods {
  // Messages
  SubscribeForMarketData = "SubscribeForMarketData",
  UnsubscribeFromMarketData = "UnsubscribeForMarketData",
  SubscribeForMBMsg = "SubscribeForMBMsg",
  UnsubscribeFromMBMsg = "UnsubscribeForMBMsg",
  SubscribeForDarkPoolPx = "SubscribeForDarkPoolPx",
  UnsubscribeFromDarkPoolPx = "UnsubscribeForDarkPoolPx",
  SubscribeForDeals = "SubscribeForDeals",
  SubscribeForPricingResponse = "SubscribeForPricingResponse",
  SubscribeForCommissionUpdate = "SubscribeForCommissionUpdate",
  UnSubscribeForCommissionUpdate = "UnSubscribeForCommissionUpdate",
}

export const DEAL_EDIT_EVENT = "deal_edit_event";
export const PRICING_RESPONSE_EVENT = "pricing_response_event";
export const NEW_DEAL_EVENT = "new_deal_event";
export const DEAL_DELETED_EVENT = "deal_deleted_event";
export const SEF_UPDATE = "sef_update";
export const REF_ALL_COMPLETE = "ref_all_complete";
export const UPDATE_COMMISSION_RATES = "update_commission_rates";

export enum Events {
  UpdateMarketData = "updateMarketData",
  UpdateDarkPoolPrice = "updateDarkPoolPx",
  ClearDarkPoolPrice = "clearDarkPoolPx",
  RefAllComplete = "refAllComplete",
  UpdateMessageBlotter = "updateMessageBlotter",
  UpdateDealsBlotter = "updateDealsBlotter",
  UpdateLegs = "updateLegs",
  OnPricingResponse = "onPricingResponse",
  OnDealDeleted = "onDealDeleted",
  OnError = "onError",
  OnSEFUpdate = "onSEFUpdate",
  OnCommissionUpdate = "onCommissionUpdate",
  OnDealEditStart = "OnDealEditStart",
  OnDealEditEnd = "OnDealEditEnd",
}
