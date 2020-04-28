import { NameHelper } from "./name-helper";
import { createImportClause, createImportDeclaration, createImportSpecifier, createImportSpecifierOption, createInterface, createMethod, createModule, createParameter, createProperty, ImportClauseOption, createCallSignature, createTypeAliasDeclaration, addComments, createPropertySignature } from "@foolishchow/tsutil";
import * as ts from "typescript";
import { Parse } from "./parse";
import { ImportHelper } from "./import-helper";
import { EOL } from "os";


export class CodeHelper {

  constructor(private nameHelper: NameHelper) { }

  /**
   * @example
   *  Vue.use(Vuex);
   */
  VueUseVuex() {
    return ts.createCall(
      ts.createPropertyAccess(
        ts.createIdentifier("Vue"),
        ts.createIdentifier("use"),
      ),
      undefined,
      [ts.createIdentifier("Vuex")]);
  }

  /**
   * @example
   *  export type ${storeName} = FVuex.Store<State,Getter,Commit,Dispatch>
   */
  FVuexStoreType() {
    let type = ts.createTypeReferenceNode(
      ts.createIdentifier("FVuex.Store"),
      [
        this.nameHelper.RootStateReference,
        this.nameHelper.RootGetterReference,
        this.nameHelper.RootCommitReference,
        this.nameHelper.RootDispatchReference
      ]
    )
    return createInterface({
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      heritageClauses: [ts.createHeritageClause(
        ts.SyntaxKind.ExtendsKeyword,
        [type as any]
      )],
      name: this.nameHelper.StoreNameIdentifier,
      members: []
    })
  }

  /**
   * @example
   * export const ${StoreName} = new Vuex.Store(${StoreName}Modules)
   */
  FVuexInit() {
    return ts.createVariableStatement(
      [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.createVariableDeclarationList([
        ts.createVariableDeclaration(
          this.nameHelper.StoreNameIdentifier,
          this.nameHelper.StoreNameReference,
          ts.createNew(
            ts.createPropertyAccess(
              ts.createIdentifier("Vuex"),
              ts.createIdentifier("Store")
            ),
            undefined,
            [this.nameHelper.ConstNameIdentifier]
          )
        )
      ], ts.NodeFlags.Const)
    )
  }

  private interfaceProperty(list: Parse.ModuleProperty[]): ts.TypeElement[] {
    return list.map(item => {
      let node = createProperty({
        name: item.name,
        type: item.type,
        questionOrExclamationToken: item.token,
      })
      addComments(node, item.comment)
      return node as any as ts.TypeElement;
    })
  }



  /**
   * @example
   *  export interface ${mod.name} {}
   */
  private createModuleState(mod: Parse.Module) {
    let state = createInterface({
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      name: ts.createIdentifier("State"),
      members: this.interfaceProperty(mod.state)
    })
    addComments(state, mod.comment)
    return state;
  }

  private createModuleGetter(mod: Parse.Module) {
    let getter = createInterface({
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      name: ts.createIdentifier("Getters"),
      members: this.interfaceProperty(mod.getter)
    })
    addComments(getter, mod.comment)
    return getter;
  }

  private createModuleGettersInRoot(mod: Parse.Module) {
    return mod.getter.map(item => {
      let name = mod.namespace ? `"${mod.name}/${item.name}"` : item.name;
      let node = createProperty({
        name: name,
        type: item.type,
        questionOrExclamationToken: item.token,
      })
      addComments(node, item.comment);
      return node;
    });
  }


  /**
   *
   * @example
   *  export type ${payloadName} = { type:"${commitOrDispatchType}",payload:any}
   */
  private createPayload(
    actOrMut: Parse.ModuleMethod,
    payloadName: string,
    commitOrDispatchType: string
  ) {
    let props: ts.PropertySignature[] = [];
    props.push(createPropertySignature({
      name: "type",
      type: ts.createStringLiteral(commitOrDispatchType) as any
    }))
    if (actOrMut.arguments.length > 0) {
      let argument = actOrMut.arguments[0];
      let t = ts.createPropertySignature(
        undefined,
        "payload",
        argument.questionToken,
        argument.type,
        undefined
      )
      props.push(t);
    }
    let type = createTypeAliasDeclaration({
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      name: payloadName,
      type: ts.createTypeLiteralNode(props)
    })
    addComments(type, actOrMut.comment)
    return type;
  }

  /**
   *
   * @param method
   * @param typeName name of commit/dispatch path
   * @param optionType
   * @param type
   */
  crateFunction(
    method: Parse.ModuleMethod,
    typeName: string,
    optionType: string,
    type?: ts.TypeNode,
    inner: boolean = false
  ) {
    let args: ts.ParameterDeclaration[] = [
      createParameter({
        name: "type",
        type: ts.createLiteralTypeNode(ts.createStringLiteral(typeName))
      })
    ];
    if (method.arguments.length > 0) {
      let argument = method.arguments[0];
      if (inner) {
        let param = argument;
        if (argument.questionToken) {
          param = createParameter({
            name: argument.name,
            type: ts.createUnionTypeNode([
              argument.type!,
              ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
            ])
          })
        }
        args.push(param)
      } else {
        args.push(argument)
      }

    } else {
      args.push(createParameter({
        name: "payload",
        questionToken: inner ? undefined : ts.createToken(ts.SyntaxKind.QuestionToken),
        type: ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
      }))
    }
    args.push(createParameter({
      name: "option",
      questionToken: inner ? undefined : ts.createToken(ts.SyntaxKind.QuestionToken),
      type: ts.createTypeReferenceNode(ts.createIdentifier(optionType), undefined)
    }))
    let node = createCallSignature({
      parameters: args,
      type: type || ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    })
    addComments(node, method.comment)
    return node;
  }

  private createPayloadFunction(
    payloadName: string,
    method: Parse.ModuleMethod,
    optionType: string,
    type?: ts.TypeNode
  ) {
    let args: ts.ParameterDeclaration[] = [
      createParameter({
        name: "payload",
        type: ts.createTypeReferenceNode(ts.createIdentifier(payloadName), undefined)
      })
    ];
    args.push(createParameter({
      name: "option",
      questionToken: ts.createToken(ts.SyntaxKind.QuestionToken),
      type: ts.createTypeReferenceNode(ts.createIdentifier(optionType), undefined)
    }))
    let node = createCallSignature({
      parameters: args,
      type: type || ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    })
    addComments(node, method.comment)
    return node;
  }

  private createCommitOrDispatch(mod: Parse.Module, type: "Commit" | "Dispatch") {
    let optionType = "FVuex.ScopedDispatchOption";
    let defines: Parse.ModuleAction[] = [];
    let PayloadName: (v: Parse.ModuleAction) => string
    if (type == "Dispatch") {
      defines = mod.action
      optionType = "FVuex.ScopedDispatchOption";
      PayloadName = (v: Parse.ModuleAction) => `DispatchPayload.${v.name}`;

    } else {
      defines = mod.mutation as any
      optionType = "FVuex.ScopedCommitOption";
      PayloadName = (v: Parse.ModuleAction) => `CommitPayload.${v.name}`;
    }
    let calls = defines.reduce((prev, action) => {
      let typeName = action.name;

      let stringParamFunction = this.crateFunction(
        action, typeName, optionType, action.type
      )
      prev.push(stringParamFunction);
      // let payload = this.createPayloadFunction(
      //   PayloadName(action),
      //   action, optionType, action.type
      // )
      // prev.push(payload)
      return prev;
    }, [] as ts.CallSignatureDeclaration[])

    return createInterface({
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      name: ts.createIdentifier(type),
      members: calls
    });
  }

  private createRootCommitOrDispatch(mod: Parse.Module, type: "Commit" | "Dispatch") {
    let optionType = "FVuex.ScopedDispatchOption";
    let defines: Parse.ModuleAction[] = [];
    let PayloadName: (v: Parse.ModuleAction) => string
    if (type == "Dispatch") {
      defines = mod.action
      optionType = "FVuex.DispatchOption"
      PayloadName = (v: Parse.ModuleAction) => `DispatchPayload.${mod.name}_${v.name}`

    } else {
      defines = mod.mutation as any
      optionType = "FVuex.CommitOption";
      PayloadName = (v: Parse.ModuleAction) => `CommitPayload.${mod.name}_${v.name}`;
    }
    let calls = defines.reduce((prev, action) => {
      let typeName = action.name;
      if (mod.namespace && !action.root) {
        typeName = `${mod.name}/${action.name}`
      }
      let stringParamFunction = this.crateFunction(
        action, typeName, optionType, action.type
      )
      prev.push(stringParamFunction);
      let payload = this.createPayloadFunction(
        PayloadName(action),
        action, optionType, action.type
      )
      prev.push(payload)
      return prev;
    }, [] as ts.CallSignatureDeclaration[])
    return calls;
  }

  private createInnerRootCommitOrDispatch(mod: Parse.Module, type: "Commit" | "Dispatch") {
    let optionType = "FVuex.ScopedDispatchOption";
    let defines: Parse.ModuleAction[] = [];
    let PayloadName: (v: Parse.ModuleAction) => string
    if (type == "Dispatch") {
      defines = mod.action
      optionType = "FVuex.DispatchOption"
      PayloadName = (v: Parse.ModuleAction) => `DispatchPayload.${mod.name}_${v.name}`

    } else {
      defines = mod.mutation as any
      optionType = "FVuex.CommitOption";
      PayloadName = (v: Parse.ModuleAction) => `CommitPayload.${mod.name}_${v.name}`;
    }
    let calls = defines.reduce((prev, action) => {
      let typeName = action.name;
      if (mod.namespace && !action.root) {
        typeName = `${mod.name}/${action.name}`
      }
      let stringParamFunction = this.crateFunction(
        action, typeName, optionType, action.type, true
      )
      prev.push(stringParamFunction);
      // let payload = this.createPayloadFunction(
      //   PayloadName(action),
      //   action, optionType, action.type
      // )
      // prev.push(payload)
      return prev;
    }, [] as ts.CallSignatureDeclaration[])
    return calls;
  }
  private createCommitOrDispatchPayload(mod: Parse.Module, type: "Commit" | "Dispatch", root: false): ts.ModuleDeclaration;
  private createCommitOrDispatchPayload(mod: Parse.Module, type: "Commit" | "Dispatch", root: true): ts.TypeAliasDeclaration[];
  private createCommitOrDispatchPayload(mod: Parse.Module, type: "Commit" | "Dispatch", root: boolean) {
    let defines: Parse.ModuleMethod[] = [];
    let PayloadName = root ?
      (v: Parse.ModuleMethod) => `${mod.name}_${v.name}` :
      (v: Parse.ModuleMethod) => v.name;
    let TypePath = root ?
      (v: Parse.ModuleMethod) => ((root && mod.namespace && !(v as any).root) ? `${mod.name}/${v.name}` : v.name)
      :
      (v: Parse.ModuleMethod) => v.name;
    if (type == "Dispatch") {
      defines = mod.action;

    } else {
      defines = mod.mutation
    }
    let payloads = defines.map(actionOrMutatation => this.createPayload(
      actionOrMutatation,
      PayloadName(actionOrMutatation),
      TypePath(actionOrMutatation)
    ));
    if (root) {
      return payloads;
    }
    return createModule({
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      flags: ts.NodeFlags.Namespace,
      name: ts.createIdentifier(`${type}Payload`),
      body: ts.createModuleBlock(payloads)
    })

  }

  private createTypeEnhancePayload(mod: Parse.Module, type: "Commit" | "Dispatch") {
    let defines: Parse.ModuleMethod[] = [];
    let PayloadName = (v: Parse.ModuleMethod) => `${mod.name}_${v.name}`;
    let TypePath = (v: Parse.ModuleMethod) => ((mod.namespace && !(v as any).root) ? `${mod.name}/${v.name}` : v.name);
    if (type == "Dispatch") {
      defines = mod.action;
    } else {
      defines = mod.mutation
    }

    return defines.map(define => {
      let typeName = "FVuex.RequiredPayload";
      let argument: ts.TypeNode = ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
      if (define.arguments.length == 0) {
        typeName = "FVuex.Payload";
      } else {
        let arg1 = define.arguments[0]
        argument = arg1.type! || ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        if (arg1.questionToken) {
          typeName = "FVuex.Payload";
        }
      }
      let type = ts.createTypeReferenceNode(
        ts.createIdentifier(typeName), [
          ts.createStringLiteral(TypePath(define)) as any,
          argument,
          (define as Parse.ModuleAction).type || ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
        ]
      )
      let declare = ts.createVariableDeclarationList([
        ts.createVariableDeclaration(
          PayloadName(define),
          type,
          ts.createAsExpression(
            ts.createStringLiteral(TypePath(define)),
            ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
          )
        )
      ], ts.NodeFlags.Const)
      let node = ts.createVariableStatement(
        [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
        declare
      )
      addComments(node, define.comment)
      return node;
    })
  }
  /**
  * @example
  *  export namespace ${storeName}NS {
  *    export module moduleName{
  *      export interface State{ ... }
  *      export interface Getters{ ... }
  *      export interface Commit{ ... }
  *      export interface CommitPayload{ ... }
  *      export interface Dispatch{ ... }
  *      export interface DispatchPayload{ ... }
  *    }
  *  }
  */
  createModule(mod: Parse.Module) {
    let state = this.createModuleState(mod);
    let getters = this.createModuleGetter(mod);

    let dispatch = this.createCommitOrDispatch(mod, "Dispatch");
    // let dispatchpayload = this.createCommitOrDispatchPayload(mod, "Dispatch", false)

    let commit = this.createCommitOrDispatch(mod, "Commit");
    // let commitPayload = this.createCommitOrDispatchPayload(mod, "Commit", false);

    let module = createModule({
      name: ts.createIdentifier(mod.name),
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      body: ts.createModuleBlock([
        state,
        getters,
        dispatch,
        // dispatchpayload,
        commit,
        // commitPayload
      ])
    })
    return createModule({
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      // flags: ts.NodeFlags.Namespace,
      name: this.nameHelper.NamespaceIdentifier,
      body: ts.createModuleBlock([module])
    })
  }

  createModuleCacheInRoot(mod: Parse.Module) {
    let Getters = this.createModuleGettersInRoot(mod);
    let Dispatch = this.createRootCommitOrDispatch(mod, "Dispatch");
    let DispatchPayloads = this.createCommitOrDispatchPayload(mod, "Dispatch", true);
    let Commit = this.createRootCommitOrDispatch(mod, "Commit");
    let CommitPayload = this.createCommitOrDispatchPayload(mod, "Commit", true);
    let InnerDispatch = this.createInnerRootCommitOrDispatch(mod, "Dispatch");
    let InnerCommit = this.createInnerRootCommitOrDispatch(mod, "Commit");
    let EnhancedCommit = this.createTypeEnhancePayload(mod, "Commit");
    let EnhancedDispatch = this.createTypeEnhancePayload(mod, "Dispatch");
    return {
      Getters,
      Dispatch,
      DispatchPayloads,
      Commit,
      CommitPayload,
      EnhancedCommit,
      InnerDispatch,
      InnerCommit,
      EnhancedDispatch
    }
  }
  /**
  * @example
  *    export interface module1{
  *      state: StoreNameNS.moduleName.State;
  *      rootState: StoreNameNS.RootState;
  *      getters: StoreNameNS.moduleName.Getters;
  *      rootGetters: StoreNameNS.RootGetter;
  *      commit: StoreNameNS.RootCommit & StoreNameNS.moduleName.Commit;
  *      dispatch: StoreNameNS.RootDispatch & StoreNameNS.moduleName.Dispatch;
  *      $store: StoreNameNS;
  *    }
  */
  private createModuleDeclareMigration(mod: Parse.Module) {
    let node = createInterface({
      name: mod.className,
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      members: [
        createProperty({
          name: "state",
          type: this.nameHelper.StateNameReference(mod.name)
        }),
        createProperty({
          name: "rootState",
          type: this.nameHelper.RootStateReference
        }),
        createProperty({
          name: "getters",
          type: this.nameHelper.GetterNameReference(mod.name)
        }),
        createProperty({
          name: "rootGetters",
          type: this.nameHelper.RootGetterReference
        }),
        createProperty({
          name: "commit",
          type: ts.createIntersectionTypeNode([
            this.nameHelper.InnerCommitReference,
            this.nameHelper.CommitNameReference(mod.name)
          ])
        }),
        createProperty({
          name: "dispatch",
          type: ts.createIntersectionTypeNode([
            this.nameHelper.InnerDispatchReference,
            this.nameHelper.DispatchNameReference(mod.name)
          ])
        }),
        createProperty({
          name: "$store",
          type: this.nameHelper.StoreNameReference
        }),
      ] as any
    })
    return node;
  }

  /**
  * @example
  *  declare module "./path/to/module" {
  *    export interface module1{
  *      state: StoreNameNS.moduleName.State;
  *      rootState: StoreNameNS.RootState;
  *      getters: StoreNameNS.moduleName.Getters;
  *      rootGetters: StoreNameNS.RootGetter;
  *      commit: StoreNameNS.RootCommit & StoreNameNS.moduleName.Commit;
  *      dispatch: StoreNameNS.RootDispatch & StoreNameNS.moduleName.Dispatch;
  *      $store: StoreNameNS;
  *    }
  *    // ...module2
  *  }
  */
  createFileDeclareMigration(fileInfo: Parse.FileInfo, declarePath: string) {
    if (fileInfo.Modules.length == 0) return;
    let migrations: ts.InterfaceDeclaration[] = [];
    fileInfo.Modules.forEach(m => {
      migrations.push(this.createModuleDeclareMigration(m));
    })
    return createModule({
      name: ts.createIdentifier(`"${declarePath}"`),
      modifiers: [ts.createToken(ts.SyntaxKind.DeclareKeyword)],
      body: ts.createModuleBlock(migrations)
    });
  }


  createImports(imports: ImportHelper.Import[]) {
    let Imports: ts.ImportDeclaration[] = [];
    imports.forEach(imp => {
      if (imp.type == "namespace") {
        Imports.push(createImportDeclaration({
          importClause: createImportClause({
            namedBindings: ts.createNamespaceImport(ts.createIdentifier(imp.current))
          }),
          moduleSpecifier: ts.createStringLiteral(imp.file)
        }))
      } else if (imp.type == "normal") {
        Imports.push(createImportDeclaration({
          importClause: createImportClause({
            name: ts.createIdentifier(imp.current)
          }),
          moduleSpecifier: ts.createStringLiteral(imp.file)
        }))
      } else {
        let opt = {
          name: ts.createIdentifier(imp.current)
        }
        if (imp.origin) (opt as any).propertyName = ts.createIdentifier(imp.origin)
        let impl = createImportSpecifier(opt)
        Imports.push(createImportDeclaration({
          importClause: createImportClause({
            namedBindings: ts.createNamedImports([impl])
          }),
          moduleSpecifier: ts.createStringLiteral(imp.file)
        }))
      }
    })
    let node = Imports[0]
    addComments(node, [[
      "this file is auto generated",
      "don't modify by hand",
      `@modified ${new Date().toDateString()} ${new Date().toTimeString()}`
    ].join(EOL)])
    return Imports;
  }

  /**
   * @example
   *  export namespace ${storeName} {
   *    export namespace State{ ... }
   *    export namespace RootState{ ... }
   *    export namespace Getter{ ... }
   *    export namespace RootGetter{ ... }
   *    export namespace Commit{ ... }
   *    export namespace RootCommit{ ... }
   *    export namespace Dispatch{ ... }
   *    export namespace RootDispatch{ ... }
   *  }
   */
  createKeel(
    modules: string[],
    rootGetters: ts.PropertyDeclaration[],
    rootDispatchs: ts.CallSignatureDeclaration[],
    rootInnerDispatchs: ts.CallSignatureDeclaration[],
    rootDispatchPayloads: ts.TypeAliasDeclaration[],
    rootCommits: ts.CallSignatureDeclaration[],
    rootInnerCommits: ts.CallSignatureDeclaration[],
    rootCommitPayloads: ts.TypeAliasDeclaration[]
  ) {

    /**
    * @example
    *    export namespace RootGetter{ ... }
    */
    let RootGetter = createInterface({
      name: ts.createIdentifier("RootGetter"),
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      members: rootGetters as any
    })

    /**
    * @example
    *    export namespace RootState{ ... }
    */
    let RootState = createInterface({
      name: ts.createIdentifier("RootState"),
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      members: modules.map(name => createProperty({
        name,
        type: ts.createTypeReferenceNode(
          this.nameHelper.StateNameIdentifier(name),
          undefined)
      }) as any)
    })

    /**
    * @example
    *    export namespace RootCommitPayload{ ... }
    */
    let CommitRootPayloads = createModule({
      flags: ts.NodeFlags.Namespace,
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      name: ts.createIdentifier("CommitPayload"),
      body: ts.createModuleBlock(rootCommitPayloads)
    })
    /**
    * @example
    *    export namespace RootCommit{ ... }
    */
    let RootCommit = createInterface({
      name: "RootCommit",
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      members: rootCommits as any
    })
    /**
    * @example
    *    export namespace RootCommit{ ... }
    */
    let RootInnerCommit = createInterface({
      name: "InnerCommit",
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      members: rootInnerCommits as any
    })
    /**
    * @example
    *    export namespace DispatchPayloads{ ... }
    */
    let RootDispatchPayloads = createModule({
      flags: ts.NodeFlags.Namespace,
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      name: ts.createIdentifier("DispatchPayload"),
      body: ts.createModuleBlock(rootDispatchPayloads as any)
    })
    /**
    * @example
    *    export namespace RootDispatch{ ... }
    */
    let RootDispatch = createInterface({
      name: "RootDispatch",
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      members: rootDispatchs as any
    })

    /**
    * @example
    *    export namespace RootDispatch{ ... }
    */
    let RootInnerDispatch = createInterface({
      name: "InnerDispatch",
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      members: rootInnerDispatchs as any
    })

    let storeMembers = [
      RootGetter,
      RootState,
      RootCommit, CommitRootPayloads, RootInnerCommit,
      RootDispatch, RootDispatchPayloads, RootInnerDispatch
    ];
    let storeBody = createModule({
      // flags: ts.NodeFlags.Namespace,
      name: this.nameHelper.NamespaceIdentifier,
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      body: ts.createModuleBlock(storeMembers as any)
    })

    return storeBody;

  }

}

