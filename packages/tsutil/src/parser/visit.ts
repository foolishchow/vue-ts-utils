import * as ts from "typescript";

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



export function findNode<T extends ts.Node>(node: ts.SourceFile) {
  let reslut: T[] = [];
  const visit = (level: number) => function Visit(node: ts.Node): void {
    console.info("│           ".repeat(level) + "├──┌── ", ts.SyntaxKind[node.kind])
    console.info("│           ".repeat(level) + "│  └── ", node)
    // console.info("│      ".repeat(level) + "│")
    ts.forEachChild(node, visit(level + 1))
  }

  visit(0)(node);
  return reslut;
}