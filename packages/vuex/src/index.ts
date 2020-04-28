import { Module as Mod, ModuleOptions } from "./module"
import { Action as Act, ActionOptions } from "./action"
import { Mutation as Mut, MutationOptions } from "./mutation"
import { DispatchOptions, CommitOptions } from "vuex"
import { Store as _Store, Payload as pl } from "vuex";

export namespace FVuex {
  export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
  export type Payload<type extends string, payload = undefined, returns = void> = string & {
    type: type,
    require: "no"
    payload?: payload,
    returns?: returns
  }
  export type RequiredPayload<type extends string, payload = undefined, returns = void> = string & {
    type: type,
    require: "yes"
    payload?: payload,
    returns?: returns
  }
  export interface _Dispatch {
    <Type extends string, Payload, Return>(payloadWith: FVuex.Payload<Type, Payload, Return>, options?: CommitOptions): Promise<Return>;
    <Type extends string, Payload, Return>(payloadWith: FVuex.RequiredPayload<Type, Payload, Return>, options?: CommitOptions): Promise<Return>;
  }
  export type Store<State, Getter = {}, Commit = {}, Dispatch = {}> =
    Omit<_Store<State>, "getters"> & {
      commit: Commit
      dispatch: Dispatch
      getters: Getter
    };
  export interface ScopedDispatchOption extends DispatchOptions { root: false };
  export interface DispatchOption extends DispatchOptions { root: true };
  export interface ScopedCommitOption extends CommitOptions { root: false };
  export interface CommitOption extends CommitOptions { root: true };
  export const Module = Mod;
  export interface ModuleOption extends ModuleOptions { };
  export const Action = Act;
  export interface ActionOption extends ActionOptions { };
  export const Mutation = Mut;
  export interface MutationOption extends MutationOptions { };
  export function addModule(obj: any, moduleName: string, cls: any) {
    (obj.modules || (obj.modules = {}))[moduleName] = cls.prototype.___decorators || cls;
  }
}

declare module "vuex/types/index" {
  export interface Dispatch {
    <Type extends string, Payload, Return>(payloadWith: FVuex.Payload<Type, Payload, Return>, payload?: Payload, options?: CommitOptions): Promise<Return>;
    <Type extends string, Payload, Return>(payloadWith: FVuex.RequiredPayload<Type, Payload, Return>, payload: Payload, options?: CommitOptions): Promise<Return>;
  }
  export interface Commit {
    <Type extends string, Payload>(payloadWithType: FVuex.Payload<Type, Payload>, payload?: Payload, options?: CommitOptions): void;
    <Type extends string, Payload>(payloadWithType: FVuex.RequiredPayload<Type, Payload>, payload: Payload, options?: CommitOptions): void;
  }
}


