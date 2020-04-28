
import * as ts from "typescript";

// TransformerFactory<SourceFile>

function isVueClassComponentDecorator(decorator: ts.Decorator) {
  return /^Component/.test(decorator.getText().replace(/^\s|\s$/g, ''));
}
function isExported(node: ts.Node) {
  return node.modifiers && node.modifiers.some(modifier => modifier.kind == ts.SyntaxKind.ExportKeyword)
}
function isVueClassComponetNode(node: ts.Node) {
  if (!isExported(node)) return false;
  if (!ts.isClassDeclaration(node)) return false;
  if (!node.decorators || node.decorators.length == 0) return false;
  if (!node.decorators.every(decorator => !isVueClassComponentDecorator(decorator))) return false;
  return true;
}

function transformClassToObject(node: ts.ClassDeclaration) {
  console.info(node)
  console.info(node.members)

  let newNode = ts.createObjectLiteral();
  let no = ts.createVariableDeclaration(
    node.name || "adasd",
    undefined,
    newNode
  );
  return ts.createClassDeclaration(undefined, [], node.name || "adasd", undefined, undefined, [])
  return ts.createVariableDeclarationList([no], ts.NodeFlags.Const)
}

export function transformVueClassToObject(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
    if (isVueClassComponetNode(node)) {
      let n = transformClassToObject(node as any);
      return n;
    }
    return ts.visitEachChild(node, visitor, context);
  }
  return function (node: ts.SourceFile): ts.SourceFile {
    return ts.visitNode(node, visitor);
  }
}

