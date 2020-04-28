import { Module as Mod, ActionContext, Mutation, Action, Store, ActionObject, ActionHandler } from "vuex";
const json = require("../package.json");
export type VuexClass<T> = T & {}
export interface ModuleOptions {
  namespace?: boolean
  name?: string;
}
export function Module<S>(module: Function & Mod<S, any>): void;
export function Module<S>(options: ModuleOptions): ClassDecorator;
export function Module<S>(func: any) {
  if (typeof func == "function") {
    let option = {
      namespace: true,
      name: (func as Function).name
    }
    return ModuleFactory(func, option)
  } else {
    return (target: Function & Mod<S, any>) => {
      return ModuleFactory(target, func)
    }
  }
}


function ModuleFactory(func: Function, option: ModuleOptions) {
  let f: any = func;

  let _decorators: Mod<any, any> = (f.prototype.___decorators || (f.prototype.___decorators = {}))

  let namespaced = option.namespace != false;
  if (namespaced) {
    _decorators.namespaced = true;
  }
  _decorators.state = function () {
    let state: any = {};
    let _state = new (func as any)();
    Object.keys(_state).forEach(key => {
      if (_state[key] !== undefined) {
        state[key] = _state[key]
      }
    });
    return state;
  };
  let proto = func.prototype;
  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key == "constructor") {
      return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(proto, key)!
    if (descriptor.get) {
      (_decorators.getters || (_decorators.getters = {}))[key] = generateGetterContext(descriptor.get);
    }
  });
  if (_decorators.mutations) {
    let mutations = _decorators.mutations
    LoopDick(mutations, (key, item) => {
      mutations[key] = generateMutationContext(key, item)
    })
  }

  if (_decorators.actions) {
    let actions = _decorators.actions as { [x: string]: ActionObject<any, any> }
    LoopDick(actions, (key, item) => {
      actions[key].handler = generateActionContext(key, item.handler)
    })
  }
  // console.info(_decorators)
}

const parsePayload = (actionName: string, payload?: any) => {
  if (payload && typeof payload == "object") {
    if (payload.type && typeof payload.type == "string" && (payload.type as string).endsWith(actionName)) {
      let keys = Object.keys(payload);
      /**
       * @example { type:"${namespace}/${actionName}",xxx:any }
       */
      if (keys.length == 2) {
        let payloadKey = keys.filter(s => s != "type")[0];
        return payload[payloadKey];
      }
      /**
       * @example { type:"${namespace}/${actionName}" }
       */
      if (keys.length == 1) {
        return undefined;
      }
    }
  }
  return payload;
}
const generateActionContext = (actionName: string, action: ActionHandler<any, any>) => {
  return function (this: Store<any>, _context: ActionContext<any, any>, payload?: any) {
    // console.info(arguments)
    let context = {
      $store: this,
      ..._context,
      get getters() {
        LogError(`can't use getters in mutation !`)
        return "";
      },
      get rootGetters() {
        LogError(`can't use getters in mutation !`)
        return "";
      }
    }
    return (action).call(context as any, parsePayload(actionName, payload));
  }
}
const generateMutationContext = (mutationName: string, mutation: Mutation<any>) => {
  return function (this: any, state: any, payload?: any) {
    // console.info(arguments)
    let context = {
      $store: this,
      state,
      get getters() {
        LogError(`can't use getters in mutation !`)
        return "";
      },
      get rootGetters() {
        LogError(`can't use getters in mutation !`)
        return "";
      }
    }
    return mutation.call(context, parsePayload(mutationName, payload))
  }
}

const generateGetterContext = (getter: Function) => {
  return function (this: any, state: any, getters: any, rootState: any, rootGetters: any) {
    let context = {
      get $store() {
        LogError(`can't use getters in mutation !`)
        throw (`can't use store in mutation !`)
        return "";
      },
      state,
      getters,
      rootState,
      rootGetters
    }
    return getter.call(context)
  }
}
const LogError = (msg: string) => {
  if (process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'test' &&
    typeof console !== 'undefined'
  ) {
    console.info(`[${json.name}] ${msg}`);
  }
}
const LoopDick = <T>(dict: { [key: string]: T }, cb: (key: string, item: T) => (void | any)) => {
  Object.keys(dict).forEach(key => {
    cb(key, dict[key])
  })
}


