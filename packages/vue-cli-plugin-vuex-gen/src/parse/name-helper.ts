import { ServiceOption } from "../watcher";
import * as ts from "typescript";

export class NameHelper {
  constructor(protected options: Required<ServiceOption>) { }

  ModulePreffixName(moduleName: string, suffix: string) {
    return `${this.Namespace}.${moduleName}.${suffix}`;
  }
  /**
   *  @example `${Namespace}.${moduleName}.State`
   */
  StateName(moduleName: string) {
    return this.ModulePreffixName(moduleName, "State");//this.Namespace + ".State." + moduleName;
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.State.${moduleName}`)
   */
  StateNameIdentifier(moduleName: string) {
    return ts.createIdentifier(this.StateName(moduleName));
  }
  /**
   *  @example ts.createTypeReferenceNode(`${Namespace}.State.${moduleName}`)
   */
  StateNameReference(moduleName: string) {
    return ts.createTypeReferenceNode(this.StateNameIdentifier(moduleName), undefined);
  }
  /**
   *  @example `${Namespace}.Getter.${moduleName}`
   */
  GetterName(moduleName: string) {
    return this.ModulePreffixName(moduleName, "Getters");//this.Namespace + ".Getter." + moduleName;
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.Getter.${moduleName}`)
   */
  GetterNameIdentifier(moduleName: string) {
    return ts.createIdentifier(this.GetterName(moduleName));
  }
  /**
   *  @example ts.createTypeReferenceNode(`${Namespace}.Getter.${moduleName}`)
   */
  GetterNameReference(moduleName: string) {
    return ts.createTypeReferenceNode(this.GetterNameIdentifier(moduleName), undefined);
  }
  /**
   *  @example `${Namespace}.Dispatch.${moduleName}`
   */
  DispatchName(moduleName: string) {
    return this.ModulePreffixName(moduleName, "Dispatch");//this.Namespace + ".Dispatch." + moduleName;
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.Dispatch.${moduleName}`)
   */
  DispatchNameIdentifier(moduleName: string) {
    return ts.createIdentifier(this.DispatchName(moduleName));
  }
  /**
   *  @example ts.createTypeReferenceNode(`${Namespace}.Dispatch.${moduleName}`)
   */
  DispatchNameReference(moduleName: string) {
    return ts.createTypeReferenceNode(this.DispatchNameIdentifier(moduleName), undefined);
  }
  /**
   *  @example `${Namespace}.Commit.${moduleName}`
   */
  CommitName(moduleName: string) {
    return this.ModulePreffixName(moduleName, "Commit");//this.Namespace + ".Commit." + moduleName;
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.Commit.${moduleName}`)
   */
  CommitNameIdentifier(moduleName: string) {
    return ts.createIdentifier(this.CommitName(moduleName));
  }
  /**
   *  @example ts.createTypeReferenceNode(`${Namespace}.Commit.${moduleName}`)
   */
  CommitNameReference(moduleName: string) {
    return ts.createTypeReferenceNode(this.CommitNameIdentifier(moduleName), undefined);
  }
  /**
   *  @example `${Namespace}.RootState`
   */
  get RootState() {
    return this.Namespace + ".RootState";
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.RootState`)
   */
  get RootStateIdentifier() {
    return ts.createIdentifier(this.RootState);
  }
  /**
  *  @example ts.createTypeReferenceNode(`${Namespace}.RootState`)
  */
  get RootStateReference() {
    return ts.createTypeReferenceNode(this.RootStateIdentifier, undefined)
  }

  /**
   *  @example `${Namespace}.RootGetter`
   */
  get RootGetter() {
    return this.Namespace + ".RootGetter";
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.RootGetter`)
   */
  get RootGetterIdentifier() {
    return ts.createIdentifier(this.RootGetter);
  }
  /**
  *  @example ts.createTypeReferenceNode(`${Namespace}.RootGetter`)
  */
  get RootGetterReference() {
    return ts.createTypeReferenceNode(this.RootGetterIdentifier, undefined)
  }

  /**
   *  @example `${Namespace}.RootDispatch`
   */
  get RootDispatch() {
    return this.Namespace + ".RootDispatch";
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.RootDispatch`)
   */
  get RootDispatchIdentifier() {
    return ts.createIdentifier(this.RootDispatch);
  }
  /**
  *  @example ts.createTypeReferenceNode(`${Namespace}.RootDispatch`)
  */
  get RootDispatchReference() {
    return ts.createTypeReferenceNode(this.RootDispatchIdentifier, undefined)
  }
  /**
     *  @example `${Namespace}.RootDispatch`
     */
  get InnerDispatch() {
    return this.Namespace + ".InnerDispatch";
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.RootDispatch`)
   */
  get InnerDispatchIdentifier() {
    return ts.createIdentifier(this.InnerDispatch);
  }
  /**
  *  @example ts.createTypeReferenceNode(`${Namespace}.RootDispatch`)
  */
  get InnerDispatchReference() {
    return ts.createTypeReferenceNode(this.InnerDispatchIdentifier, undefined)
  }
  /**
   *  @example `${Namespace}.RootCommit`
   */
  get RootCommit() {
    return this.Namespace + ".RootCommit";
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.RootCommit`)
   */
  get RootCommitIdentifier() {
    return ts.createIdentifier(this.RootCommit);
  }
  /**
  *  @example ts.createTypeReferenceNode(`${Namespace}.RootCommit`)
  */
  get RootCommitReference() {
    return ts.createTypeReferenceNode(this.RootCommitIdentifier, undefined)
  }
  /**
   *  @example `${Namespace}.RootCommit`
   */
  get InnerCommit() {
    return this.Namespace + ".InnerCommit";
  }
  /**
   *  @example ts.createIdentifier(`${Namespace}.RootCommit`)
   */
  get InnerCommitIdentifier() {
    return ts.createIdentifier(this.InnerCommit);
  }
  /**
  *  @example ts.createTypeReferenceNode(`${Namespace}.RootCommit`)
  */
  get InnerCommitReference() {
    return ts.createTypeReferenceNode(this.InnerCommitIdentifier, undefined)
  }
  /**
   *  @example `${Namespace}`
   */
  get Namespace() {
    return this.options.store + "NS";
  }
  /**
  *  @example ts.createIdentifier(`${Namespace}`)
  */
  get NamespaceIdentifier() {
    return ts.createIdentifier(this.Namespace);
  }
  /**
   *  @example ts.createTypeReferenceNode(`${Namespace}`)
   */
  get NamespaceReference() {
    return ts.createTypeReferenceNode(this.NamespaceIdentifier, undefined);
  }
  /**
   *  @example `${Namespace}`
   */
  get StoreName() {
    return this.options.store;
  }
  /**
  *  @example ts.createIdentifier(`${Namespace}`)
  */
  get StoreNameIdentifier() {
    return ts.createIdentifier(this.StoreName);
  }
  /**
   *  @example ts.createTypeReferenceNode(`${Namespace}`)
   */
  get StoreNameReference() {
    return ts.createTypeReferenceNode(this.StoreNameIdentifier, undefined);
  }
  /**
   *  @example `${Namespace}Modules`
   */
  get ConstName() {
    return this.options.store + "Modules";
  }
  /**
  *  @example ts.createIdentifier(`${Namespace}Modules`)
  */
  get ConstNameIdentifier() {
    return ts.createIdentifier(this.options.store + "Modules");
  }
  /**
   *  @example ts.createTypeReferenceNode(`${Namespace}Modules`)
   */
  get ConstNameReferennce() {
    return ts.createTypeReferenceNode(this.ConstNameIdentifier, undefined);
  }
}