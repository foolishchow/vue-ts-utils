import * as ts from "typescript";

export interface NormalImport {
  file: string;
  type: "normal";
  current: string
}
export interface NamedImport {
  file: string;
  type: "named";
  current: string,
  origin?: string
}
export interface NamespaceImport {
  file: string;
  type: "namespace";
  current: string,
}
export type Import = NormalImport | NamedImport | NamespaceImport;

// export function parseImport(fileName: string, sourceFile: ts.SourceFile, alias: any, mainFile: string): Import[] {
  // let Imports: Import[] = [];
  // $(sourceFile).find("ImportDeclaration").map((node) => {
  //   let file = PathHelper.getFilePath(fileName, alias, node.moduleSpecifier.getText(), mainFile);
  //   let ImportClauses = $(node).find("ImportClause").self;
  //   ImportClauses.forEach(i => {
  //     let namedBindings = i.namedBindings;
  //     if (!namedBindings) return;
  //     if (i.name) {
  //       Imports.push({
  //         file,
  //         type: "normal",
  //         current: i.name!.escapedText as string
  //       })
  //     }
  //     if (ts.isNamespaceImport(namedBindings)) {
  //       // import * as ts from "typescript"
  //       Imports.push({
  //         file,
  //         type: "namespace",
  //         current: namedBindings.name.escapedText as string
  //       })
  //     } else if (ts.isNamedImports(namedBindings)) {
  //       // import {readFileSync} from "fs"
  //       namedBindings.elements.forEach(e => {
  //         let i: Import = {
  //           file,
  //           type: "named",
  //           current: e.name.escapedText as string
  //         }
  //         // import {readFileSync as propertyName} from "fs"
  //         if (e.propertyName) {
  //           i.origin = e.propertyName.escapedText as string
  //           i.current = e.name.escapedText as string;
  //         }
  //         Imports.push(i);
  //       })
  //     }
  //   })
  // })
  // return Imports;
// }
