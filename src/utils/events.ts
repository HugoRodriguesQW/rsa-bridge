type Subscription = {
  eventName: string;
  callback: (scope?: EventSubscriber["scope"]) => void;
};

export class EventSubscriber {
  #subscriptions: Subscription[];
  scope: any;

  constructor(scope?: any) {
    this.#subscriptions = [];
    this.scope = scope;
  }

  emit(eventName: string) {
    this.#subscriptions = this.#subscriptions
      .map((s) => {
        if (s.eventName === eventName) {
          s.callback(this.scope);
          return true;
        }
        return s;
      })
      .filter((s) => s !== true) as Subscription[];
  }

  add(eventName: string, callback: Subscription["callback"]) {
    this.#subscriptions.push({ eventName, callback });
  }

  remove(subscription: Subscription) {
    this.#subscriptions = this.#subscriptions.filter((s) => s !== subscription);
  }
}