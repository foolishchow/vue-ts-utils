import * as ts from "typescript";
import { tsquery } from "@phenomnomnominal/tsquery";



interface QueryType {
  ClassDeclaration: ts.ClassDeclaration,
  PropertyDeclaration: ts.PropertyDeclaration,
  ExportKeyword: ts.ExportDeclaration
}
type QyeryKeys = keyof QueryType
type TypedFunction<T> = (...args: any[]) => T


class QueryInstance<T extends (ts.SourceFile | ts.Node) = (ts.SourceFile | ts.Node)> {
  private nodes: T[];
  constructor(node: T | T[]) {
    if (Array.isArray(node)) {
      this.nodes = node
    } else {
      // @ts-ignore
      this.nodes = [node]
    }
  }

  has(type: string[], must = false) {
    if (must) {
      return type.every(t => this.find(t).length > 0)
    } else {
      return type.some(t => this.find(t).length > 0)
    }
  }
  child(type: string) {
    let r = this.nodes.reduce((prev, node) => {
      let nodes = tsquery.query(node, type)
        // @ts-ignore
        .filter(n => n.parent.id == node.id);
      prev = prev.concat(nodes);
      return prev;
    }, [] as ts.Node[])
    return $(r);
  }



  find<T extends ts.Node = ts.Node>(type: string) {
    return $(this.nodes.reduce((prev, node) => {
      let nodes = tsquery.query(node as any, type)
      prev = prev.concat(nodes as any);
      return prev;
    }, [] as T[]));
  }

  closest<T extends ts.Node = ts.Node>(type: string): QueryInstance<T> {
    let r = this.nodes.reduce((prev, node) => {
      let current = node as any as ts.Node;
      let parent = node.parent;
      let match: T[] = [];
      let matched = false;
      // @ts-ignore
      while (!matched && parent.parent) {
        current = parent;
        parent = parent.parent;
        match = tsquery.query(parent, type);
        // @ts-ignore
        matched = match.length > 0 && match.some(m => m.id == current.id)
      }
      prev = prev.concat(
        match.filter(m => {
          // @ts-ignore
          return m.id == current.id
        }));
      return prev;
    }, [] as T[])
    return $(r)
  }

  filter(cb: (item: T, index: number, arrar: T[]) => boolean) {
    return $((this.nodes as any as T[]).filter(cb) as any as T)
  }

  map<S>(cb: (item: T, index: number, arrar: T[]) => (S | void)) {
    return (this.nodes as any as T[]).map(cb)
  }

  each(cb: (item: T, index: number, arrar: T[]) => (T | void)) {
    (this.nodes as any as T[]).forEach(cb);
    return this;
  }

  get length() {
    return this.nodes.length;
  }

  index(index: number) {
    return this.nodes[index]
  }

  get self() {
    return this.nodes;
  }

}
interface QueryInstance<T extends (ts.SourceFile | ts.Node) = (ts.SourceFile | ts.Node)> {


  find(type: "Identifier"): QueryInstance<ts.Identifier>;
  child(type: "Identifier"): QueryInstance<ts.Identifier>;
  closest(type: "Identifier"): QueryInstance<ts.Identifier>;

  find(type: "CallExpression"): QueryInstance<ts.CallExpression>;
  child(type: "CallExpression"): QueryInstance<ts.CallExpression>;
  closest(type: "CallExpression"): QueryInstance<ts.CallExpression>;

  find(type: "PropertyAccessExpression"): QueryInstance<ts.PropertyAccessExpression>;
  child(type: "PropertyAccessExpression"): QueryInstance<ts.PropertyAccessExpression>;
  closest(type: "PropertyAccessExpression"): QueryInstance<ts.PropertyAccessExpression>;


  find(type: "QualifiedName"): QueryInstance<ts.QualifiedName>;
  child(type: "QualifiedName"): QueryInstance<ts.QualifiedName>;
  closest(type: "QualifiedName"): QueryInstance<ts.QualifiedName>;

  find(type: "ImportClause"): QueryInstance<ts.ImportClause>;
  child(type: "ImportClause"): QueryInstance<ts.ImportClause>;
  closest(type: "ImportClause"): QueryInstance<ts.ImportClause>;

  find(type: "ImportDeclaration"): QueryInstance<ts.ImportDeclaration>;
  child(type: "ImportDeclaration"): QueryInstance<ts.ImportDeclaration>;
  closest(type: "ImportDeclaration"): QueryInstance<ts.ImportDeclaration>;

  find(type: "ClassDeclaration"): QueryInstance<ts.ClassDeclaration>;
  child(type: "ClassDeclaration"): QueryInstance<ts.ClassDeclaration>;
  closest(type: "ClassDeclaration"): QueryInstance<ts.ClassDeclaration>;

  find(type: "ModuleDeclaration"): QueryInstance<ts.ModuleDeclaration>;
  child(type: "ModuleDeclaration"): QueryInstance<ts.ModuleDeclaration>;
  closest(type: "ModuleDeclaration"): QueryInstance<ts.ModuleDeclaration>;

  find(type: "InterfaceDeclaration"): QueryInstance<ts.InterfaceDeclaration>;
  child(type: "InterfaceDeclaration"): QueryInstance<ts.InterfaceDeclaration>;
  closest(type: "InterfaceDeclaration"): QueryInstance<ts.InterfaceDeclaration>;
  find(type: string): QueryInstance<ts.Node>;
  child(type: string): QueryInstance<ts.Node>;
  closest(type: string): QueryInstance<ts.Node>;
}
export function $<T extends (ts.SourceFile | ts.Node) = (ts.SourceFile | ts.Node)>(node: T | T[]): QueryInstance<T> {
  return new QueryInstance(node);
}