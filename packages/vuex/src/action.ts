
export interface ActionOptions {
  dispatch?: string;
  root?: boolean
}
export function Action<S>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<S>): void;
export function Action<S>(options: ActionOptions): MethodDecorator;
export function Action<T>(options: any, propertyKey?: any, descriptor?: any) {
  if (propertyKey && descriptor) {
    let opt: ActionOptions = {
      dispatch: propertyKey
    }
    ActionFactory(opt, options, propertyKey, descriptor);
  } else {
    return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
      ActionFactory(options, target, propertyKey, descriptor);
    }
  }
}


export function ActionFactory(option: ActionOptions, target: any, propertyKey: any, descriptor: TypedPropertyDescriptor<any>) {
  let _decorators = (target.___decorators || (target.___decorators = {}));
  let _actions = (_decorators.actions || (_decorators.actions = {}));
  if (typeof descriptor.value == "function") {
    let name = option.dispatch || propertyKey;
    _actions[name] = {
      handler: descriptor.value
    }
    if (option.root) _actions[name].root = true;
  }
}