import { $, tsquery, parseComment } from "@foolishchow/tsutil";
import * as ts from "typescript";
import { runInNewContext } from "vm";
import { ServiceOption, WebpackAlias } from "../watcher";
import { PathHelper } from "./path-helper";
import { ImportHelper } from "./import-helper";


export namespace Parse {
  export interface ModuleMethod {
    comment: string[]
    name: string;
    functionName: string;
    arguments: ts.ParameterDeclaration[];
  }
  export interface ModuleAction extends ModuleMethod {
    type?: ts.TypeNode
    root: boolean
  }
  export interface ModuleMutation extends ModuleMethod { }

  export interface ModuleProperty {
    comment: string[];
    name: string | ts.Identifier,
    type: ts.TypeNode
    token?: ts.QuestionToken | ts.ExclamationToken
  }
  export interface Module {
    name: string;
    comment: string[];
    className: string;
    namespace: boolean;
    state: ModuleProperty[];
    getter: ModuleProperty[];
    action: ModuleAction[],
    mutation: ModuleMutation[],
    import?: ImportHelper.Import
  }
  export interface ModuleRootCache {
    Getters: ts.PropertyDeclaration[];
    Dispatch: ts.CallSignatureDeclaration[];
    InnerDispatch: ts.CallSignatureDeclaration[];
    DispatchPayloads: ts.TypeAliasDeclaration[];
    EnhancedDispatch: ts.VariableStatement[];
    InnerCommit: ts.CallSignatureDeclaration[];
    Commit: ts.CallSignatureDeclaration[];
    CommitPayload: ts.TypeAliasDeclaration[];
    EnhancedCommit: ts.VariableStatement[];
  }
  export interface FileGenerateCache {
    moduleCachesInRoot: ModuleRootCache[]
    modules: ts.ModuleDeclaration[];
    declareMigration?: ts.ModuleDeclaration
  }

  export interface FileInfo {
    changed: boolean;
    cache: FileGenerateCache;
    imports: ImportHelper.Import[],
    Modules: Parse.Module[]
  }

  function ClassName(node: ts.ClassDeclaration) {
    return node.name ? node.name.escapedText as string : "";
  }

  /**
   *
   * @param script
   * @param functionName
   * @example
   *  evalInNewContext('FVue.Module({ name: "aaa", namespace: true })') => { name: "aaa", namespace: true }
   */
  function evalInNewContext(script: string) {
    let scripts = `
    var cache = {};
    var f = function (v) { return v; };
    function P(name) {
        var p = new Proxy(f, {
            get: function (target, prototypeName, receiver) {
                if (typeof prototypeName == "string") {
                    if (!cache[prototypeName])
                        cache[prototypeName] = P(name + "." + prototypeName);
                    return cache[prototypeName];
                }
            },
            apply: function (target, thisArgs, ArgsArr) {
                return f.apply(thisArgs, ArgsArr);
            }
        });
        cache[name] = p;
        return p;
    };`;
    let n = tsquery.ast(script);
    $(n).find("CallExpression").each(node => {
      if (ts.isIdentifier(node.expression)) {
        let name = node.expression.text
        scripts += `var ${name} = P("${name}");`
      }
    })
    $(n).find("QualifiedName").each(node => {
      if (ts.isIdentifier(node.left)) {
        let name = node.left.text;
        scripts += `var ${name} = P("${name}");`
      }
    })
    $(n).find("PropertyAccessExpression").each(node => {
      if (ts.isIdentifier(node.expression)) {
        let name = node.expression.text
        scripts += `var ${name} = P("${name}");`
      }
    })
    scripts += `exports = ${script};`
    const m = { exports: {} }
    runInNewContext(scripts, m)
    return m.exports as any;
  }

  export function Loop<S, T>(dict: ts.MapLike<S>, cb: (key: string, item: S, keyIndex: number) => T): T[] {
    return Object.keys(dict).map((fileName, index) => cb(fileName, dict[fileName], index))
  }

  export function Reduce<S, R>(dict: ts.MapLike<S>, cb: (prev: R, key: string, item: S, keyIndex: number) => R, init: R): R {
    return Object.keys(dict).reduce((prev, fileName, index) => {
      return cb(prev, fileName, dict[fileName], index)
    }, init)
  }

  function generatePromiseTypeNode(node: ts.TypeNode | undefined) {
    if (node == undefined) {
      return ts.createTypeReferenceNode(ts.createIdentifier("Promise"), [ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)])
    }

    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text == "Promise") {
      return node;
    }
    return ts.createTypeReferenceNode(ts.createIdentifier("Promise"), [node])
  }


  function parseState(config: Module, classOrigin: ts.ClassDeclaration, classDts: ts.ClassDeclaration) {
    let statePropNames: string[] = [];
    $(classOrigin).find("PropertyDeclaration>Identifier").each((i) => {
      let d = (i as ts.PropertyDeclaration);
      statePropNames.push((i as ts.PropertyDeclaration).getText());
    })
    statePropNames.forEach(name => {
      let d = $(classDts).find(`PropertyDeclaration:has(Identifier[name=${name}])`).self as ts.PropertyDeclaration[];
      // maybe proper is private
      if (d.length > 0) {
        let stateNode = d[0];
        config.state.push({
          name,
          comment: parseComment(stateNode),
          token: stateNode.questionToken || stateNode.exclamationToken,
          type: stateNode.type || ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        })
      }
    })
  }

  function parseGetters(config: Module, classOrigin: ts.ClassDeclaration, classDts: ts.ClassDeclaration) {
    let getterPropNames: string[] = [];
    $(classOrigin).find("GetAccessor>Identifier").each((i) => {
      let d = (i as ts.GetAccessorDeclaration);
      getterPropNames.push(d.getText());
    })
    getterPropNames.forEach(name => {
      let d = $(classDts).find(`PropertyDeclaration:has(Identifier[name=${name}])`).self as ts.PropertyDeclaration[];
      // maybe proper is private
      if (d.length > 0) {
        // config.getter.push(d[0])
        let getterNode = d[0];
        config.getter.push({
          name,
          comment: parseComment(getterNode),
          token: getterNode.questionToken || getterNode.exclamationToken,
          type: getterNode.type || ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        })
      }
    })
  }

  function parseAction(option: Required<ServiceOption>, config: Module, classOrigin: ts.ClassDeclaration, classDts: ts.ClassDeclaration) {
    let actionMethod: ModuleAction[] = [];

    QueryHelper.LoopEachResult(
      classOrigin, option.Action,
      node => {
        let d = node as ts.MethodDeclaration

        let fn = $(d).child("Identifier").self[0].getText();
        let action: ModuleAction = {
          comment: [],
          name: fn,
          functionName: fn,
          arguments: [] as any,
          root: false,
          type: generatePromiseTypeNode(d.type)
        }
        actionMethod.push(action)
      },
      v => `MethodDeclaration:has(Decorator>${QueryHelper.PropertyAccessExpression(v)})`
    );

    QueryHelper.LoopEachResult(
      classOrigin, option.Action,
      node => {
        let d = node as ts.MethodDeclaration
        let decorators = QueryHelper.findUntilResult(d, option.Action, v => `Decorator>${QueryHelper.CallExpression(v)}`) as ts.CallExpression[];
        if (decorators.length == 0) return;
        let decorator = decorators[0];//$(d).find(`Decorator>${QueryHelper.CallExpression(option.Action[0])}`).self[0] as ts.CallExpression;
        let configN = evalInNewContext(decorator.getText())
        let functionName = $(d).child("Identifier").self[0].getText()
        let action: ModuleAction = {
          comment: parseComment(d),
          name: configN.dispatch ? configN.dispatch : functionName,
          arguments: [] as any,
          functionName,
          root: configN.root == true ? true : false,
          type: generatePromiseTypeNode(d.type)
        }
        actionMethod.push(action)
      },
      v => `MethodDeclaration:has(Decorator>${QueryHelper.CallExpression(v)})`
    )

    actionMethod.forEach((Action, index) => {
      let methods = $(classDts).find(`MethodDeclaration:has(Identifier[name=${Action.functionName}])`).self as ts.MethodDeclaration[];
      if (methods.length == 0) return;
      let method = methods[0];
      let action = {
        comment: parseComment(method),
        name: Action.name,
        root: Action.root,
        functionName: Action.functionName,
        arguments: Array.from(method.parameters),
        type: (method.type)
      }
      config.action.push(action)
    })
  }

  function parseMutation(option: Required<ServiceOption>, config: Module, classOrigin: ts.ClassDeclaration, classDts: ts.ClassDeclaration) {
    let MutationMethod: ModuleMethod[] = [];
    // let ProperMutation = `MethodDeclaration:has(Decorator>${PropertyAccessExpression(option.Mutation[0])})`,
    // CallMutation = `MethodDeclaration:has(Decorator>${CallExpression(option.Mutation[0])})`;

    QueryHelper.LoopEachResult(
      classOrigin, option.Mutation,
      node => {
        let d = node as ts.MethodDeclaration
        let fn = $(d).child("Identifier").self[0].getText();
        let action: ModuleMethod = {
          comment: parseComment(d),
          name: fn,
          functionName: fn,
          arguments: [] as any,
        }
        MutationMethod.push(action)
      },
      v => `MethodDeclaration:has(Decorator>${QueryHelper.PropertyAccessExpression(v)})`
    );
    QueryHelper.LoopEachResult(
      classOrigin, option.Mutation,
      node => {
        let d = node as ts.MethodDeclaration
        let decorators = QueryHelper.findUntilResult(d, option.Mutation,
          v => `Decorator>${QueryHelper.CallExpression(v)}`) as ts.CallExpression[];
        if (decorators.length == 0) return;
        let decorator = decorators[0];
        // let decorator = $(d).find(`Decorator>${CallExpression(option.Mutation[0])}`).self[0] as ts.CallExpression;
        let configN = evalInNewContext(decorator.getText())
        let functionName = $(d).child("Identifier").self[0].getText()
        let action: ModuleMethod = {
          comment: parseComment(d),
          name: configN.commit ? configN.commit : functionName,
          arguments: [] as any,
          functionName
        }
        MutationMethod.push(action)
      },
      v => `MethodDeclaration:has(Decorator>${QueryHelper.CallExpression(v)})`
    );

    MutationMethod.forEach((Mutation, index) => {
      let methods = $(classDts)
        .find(`MethodDeclaration:has(Identifier[name=${Mutation.functionName}])`).self as ts.MethodDeclaration[];
      if (methods.length == 0) return;
      let method = methods[0];
      let mutation: ModuleMutation = {
        comment: parseComment(method),
        name: Mutation.name,
        functionName: Mutation.functionName,
        arguments: Array.from(method.parameters)
      }
      config.mutation.push(mutation)
    })
  }

  function parseModuleClass(
    option: Required<ServiceOption>, fileName: string,
    sourceFile: ts.SourceFile, sourceDts: ts.SourceFile
  ): Module[] {
    return $(sourceFile).find("ClassDeclaration").self.map(s => {
      if (!s.modifiers || !s.decorators) return false;
      if (s.modifiers.every(m => m.kind != ts.SyntaxKind.ExportKeyword)) return false;
      let callExpression: ts.CallExpression[] = QueryHelper.findUntilResult(s, option.Module, v => `Decorator>${QueryHelper.CallExpression(v)}`) as any;
      let propertyAccessExpression: ts.PropertyAccessExpression[] = QueryHelper.findUntilResult(s, option.Module, v => `Decorator>${QueryHelper.PropertyAccessExpression(v)}`) as any;
      if (propertyAccessExpression.length == 0 && callExpression.length == 0) {
        return false;
      }
      let config: Module = {
        comment: parseComment(s),
        className: ClassName(s),
        name: ClassName(s) || PathHelper.camel(PathHelper.FileName(fileName)),
        namespace: true,
        state: [],
        getter: [],
        action: [],
        mutation: []
      }
      if (callExpression.length > 0) {
        let ar = callExpression[0].getText();
        let configN = evalInNewContext(ar)
        config = Object.assign(config, configN);
      }
      let className = ClassName(s);
      let dtsClass = $(sourceDts).find(`ClassDeclaration:has(Identifier[name=${className}])`).self[0] as ts.ClassDeclaration
      if (dtsClass) {
        parseState(config, s, dtsClass);
        parseGetters(config, s, dtsClass);
        parseAction(option, config, s, dtsClass);
        parseMutation(option, config, s, dtsClass);
      }
      return config;
    }).filter(s => s != false) as Module[];
  }

  export function parse(option: Required<ServiceOption>, alias: WebpackAlias, fileName: string, sourceFile: ts.SourceFile, sourceDts: ts.SourceFile): Parse.FileInfo {
    return {
      changed: true,
      cache: {
        moduleCachesInRoot: [],
        modules: []
      },
      imports: ImportHelper.parseImport(fileName, sourceFile, alias, option.file),
      Modules: parseModuleClass(option, fileName, sourceFile, sourceDts)
    }
  }

}


export namespace QueryHelper {
  export function LoopEachResult(node: ts.Node, identifiers: string[], cb: (node: ts.Node) => void, transform?: (query: string) => string) {
    identifiers.forEach(id => {
      let queryExpression = transform ? transform(id) : id;
      let results = $(node).find(queryExpression).self as ts.CallExpression[];
      if (results.length) results.forEach(cb)
    })
  }
  export function findUntilResult(node: ts.Node, identifiers: string[], transform?: (query: string) => string) {
    let results: ts.Node[] = [];
    identifiers.forEach(id => {
      if (results.length == 0) {
        let queryExpression = transform ? transform(id) : id;
        results = $(node).find(queryExpression).self as ts.CallExpression[];
      }
    })
    return results;
  }
  export function CallExpression(name: string) {
    let ModuleNameList = name.split("."),
      length = ModuleNameList.length - 1;
    // FVuex.Module
    return ModuleNameList.reduceRight((prev, item, index, list) => {
      if (index == length) {
        prev += `>CallExpression:has(Identifier[name=${item}])`;
      } else {
        prev += `:has(PropertyAccessExpression:has(Identifier[name=${item}])`;
      }
      return prev;
    }, "").substring(1) + ")".repeat(length);
  }
  export function PropertyAccessExpression(name: string) {
    let ModuleNameList = name.split("."),
      length = ModuleNameList.length - 1;

    // FVuex.Module
    return ModuleNameList.reduceRight((prev, item, index, list) => {
      if (index > 1) {
        prev += `:has(PropertyAccessExpression:has(Identifier[name=${item}])`;
      } else if (index == 1) {
        prev += `:has(PropertyAccessExpression:has(Identifier[name=${item}]):has(Identifier[name=${list[0]}])`;
      }
      return prev;
    }, "").substring(5) + ")".repeat(length - 1);
  }
  export function SS(params: any) {

  }
}

