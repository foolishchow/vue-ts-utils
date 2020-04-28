import * as ts from "typescript";
import { Parse } from "./parse";

export namespace ReferenceHelper {

  function transformNode<T extends ts.Node>(originName: string, newName: string, node: T) {
    const t = (context: ts.TransformationContext) => (node: ts.Node) => {
      function Visit(node: ts.Node): ts.Node {
        if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text == originName) {
          node = ts.updateTypeReferenceNode(node, ts.createIdentifier(newName), node.typeArguments)
        }
        if (ts.isQualifiedName(node) && ts.isIdentifier(node.left) && node.left.text == originName) {
          node = ts.updateQualifiedName(node, ts.createIdentifier(newName), node.right);
        }
        node = ts.visitEachChild(node, Visit, context)
        return node;
      }
      return ts.visitNode(node, Visit)
    }
    let result = ts.transform(node, [t])
    return result.transformed[0] as T
  }

  export function TransformFileInfo(originName: string, newName: string, fileInfo: Parse.FileInfo) {
    fileInfo.Modules.forEach(mod => {
      mod.action = mod.action.map(act => {
        act.arguments = act.arguments.map(a => {
          if (a.type) a.type = transformNode(originName, newName, a.type)
          return a;
        })
        if (act.type) act.type = transformNode(originName, newName, act.type)
        return act;
      })
      mod.mutation = mod.mutation.map(mut => {
        mut.arguments = mut.arguments.map(a => {
          if (a.type) a.type = transformNode(originName, newName, a.type)
          return a;
        })
        return mut;
      })
      mod.state = mod.state.map(sta => {
        if (sta.type) sta.type = transformNode(originName, newName, sta.type)
        return sta;
      })
    })
  }
}