import * as ts from "typescript";
import * as fs from "fs";

interface DocEntry {
  name?: string;
  fileName?: string;
  documentation?: string;
  type?: string;
  constructors?: DocEntry[];
  parameters?: DocEntry[];
  returnType?: string;
  members?: { [x: string]: DocEntry[] };
}

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(
  fileNames: string[],
  options: ts.CompilerOptions
): void {
  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  let output: DocEntry[] = [];

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      // Walk the tree to search for classes
      ts.forEachChild(sourceFile, visit);
    }
  }

  // print out the doc
  // fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));
  console.info(JSON.stringify(output, undefined, 4))
  return;

  /** visit nodes finding exported classes */
  function visit(node: ts.Node) {
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }

    if (ts.isClassDeclaration(node) && node.name) {
      // This is a top level class, get its symbol
      let symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        output.push(serializeClass(symbol));
      }
      // No need to walk any further, class expressions/inner declarations
      // cannot be exported
    } else if (ts.isModuleDeclaration(node)) {
      // This is a namespace, visit its children
      ts.forEachChild(node, visit);
    } else if (ts.isFunctionDeclaration(node)) {
      let symbol = checker.getSymbolAtLocation(node.name!);
      if (symbol) {
        output.push(serializeMethod(symbol))
      }
    }
  }

  /** Serialize a symbol into a json object */
  function serializeSymbol(symbol: ts.Symbol): DocEntry {
    return {
      name: symbol.getName(),
      documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
      type: checker.typeToString(
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
      )
    };
  }

  function serializeMethod(symbol: ts.Symbol): DocEntry {
    let returnType = checker
      .getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
      .getCallSignatures();
    return {
      name: symbol.getName(),
      documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
      type: checker.typeToString(
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
      ),
      returnType: returnType.map(serializeSignature) as any
    }
  }
  /** Serialize a class symbol information */
  function serializeClass(symbol: ts.Symbol) {
    let details = serializeSymbol(symbol);

    // Get the construct signatures
    let constructorType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );

    details.constructors = constructorType
      .getConstructSignatures()
      .map(serializeSignature);
    if (constructorType.symbol.members) {
      let members = constructorType.symbol.members
      details.members = {};
      members.forEach((val, key) => {
        if (key == "__constructor") return;
        let ss = checker.getTypeOfSymbolAtLocation(val, val.valueDeclaration!).getCallSignatures().map(serializeSignature);
        details.members![key as any] = ss;
        console.info(val)
      })

    }
    return details;
  }

  /** Serialize a signature (call or construct) */
  function serializeSignature(signature: ts.Signature) {
    let type = signature.getReturnType();
    // type.getSymbol()!.
    console.info("symbol======", type.getSymbol() ? type.getSymbol()!.name : "")
    console.info(type.getSymbol())
    console.info("type=======")
    console.info(type)
    console.info("end=======")
    ts.NodeFlags
    // ts.isExternalModule
    return {
      parameters: signature.parameters.map(serializeSymbol),
      returnType: checker.typeToString(signature.getReturnType()),
      documentation: ts.displayPartsToString(signature.getDocumentationComment(checker))
    };
  }

  /** True if this is visible outside this file, false otherwise */
  function isNodeExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node as any) & ts.ModifierFlags.Export) !== 0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }
}

generateDocumentation(["/Users/hackintosh-01/Desktop/oprate/fireweed-utils/packages/tsutil/src/test/test.ts"], {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS
});

setInterval(() => { }, 2000)