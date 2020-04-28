import { Store } from "vuex";

export interface MutationOptions {
  commit?: string;
}

export function Mutation<S>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<S>): void;
export function Mutation<S>(options: MutationOptions): MethodDecorator;
export function Mutation<T>(options: any, propertyKey?: any, descriptor?: any) {
  if (propertyKey && descriptor) {
    let opt: MutationOptions = {
      commit: propertyKey
    }
    MutationFactory(opt, options, propertyKey, descriptor);
  } else {
    return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
      MutationFactory(options, target, propertyKey, descriptor);
    }
  }
}


export function MutationFactory(option: MutationOptions, target: any, propertyKey: any, descriptor: TypedPropertyDescriptor<any>) {
  let _decorators = (target.___decorators || (target.___decorators = {}));
  let _mutations = (_decorators.mutations || (_decorators.mutations = {}));
  if (typeof descriptor.value == "function") {
    let name = option.commit || propertyKey;
    _mutations[name] = descriptor.value
  }
}