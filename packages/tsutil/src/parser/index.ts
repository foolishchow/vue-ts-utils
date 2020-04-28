import * as ts from "typescript";

export interface ITypescriptParserOptions {
  type: "class"
}
// export interface ITypescriptParser {
// (option: ITypescriptParserOptions): this;
// }

interface IdentifierParser {
  (name: ts.Identifier): boolean
}


export interface ParseHeritageClauseOptions {
  type: "extends" | "implements",

}

export interface ParseClassOptions {
  name?: string | IdentifierParser;
  heritageClause?: string
}

export function parseClass(
  options: ITypescriptParserOptions,
  sourceFile: ts.SourceFile,
  sourceDtsFile: ts.SourceFile
) {
  let classDeclaration = {} as ts.ClassDeclaration;
  classDeclaration.heritageClauses;
  let heritageClause = {} as ts.HeritageClause
  heritageClause.token
  let type = heritageClause.types[0]
  type.expression
}

const opt = {
  name: ""
}

