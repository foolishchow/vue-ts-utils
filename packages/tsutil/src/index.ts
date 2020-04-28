import * as ts from "typescript"
import { EOL } from "os";
export { $ } from './tsquery'
export { tsquery } from "@phenomnomnominal/tsquery";
export type createImportSpecifierOption = {
  propertyName?: ts.Identifier,
  name: ts.Identifier
}
export const createImportSpecifier = (option: createImportSpecifierOption) => ts.createImportSpecifier(option.propertyName, option.name)

export type ImportClauseOption = {
  name?: ts.Identifier;
  namedBindings?: ts.NamedImportBindings;
};

export const createImportClause = (option: ImportClauseOption) => ts.createImportClause(option.name, option.namedBindings)
type ImportDeclarationOption = {
  decorators?: ReadonlyArray<ts.Decorator>;
  modifiers?: ReadonlyArray<ts.Modifier>;
  importClause?: ts.ImportClause;
  moduleSpecifier: ts.Expression;
};

export const createImportDeclaration = (option: ImportDeclarationOption) => ts.createImportDeclaration(
  option.decorators,
  option.modifiers,
  option.importClause,
  option.moduleSpecifier
)

type ArrowFunctionOption = {
  modifiers?: ReadonlyArray<ts.Modifier>,
  typeParameters?: ReadonlyArray<ts.TypeParameterDeclaration>,
  parameters: ReadonlyArray<ts.ParameterDeclaration>,
  type?: ts.TypeNode,
  equalsGreaterThanToken?: ts.EqualsGreaterThanToken,
  body: ts.ConciseBody
};

export const createArrowFunction = (option: ArrowFunctionOption) => ts.createArrowFunction(
  option.modifiers,
  option.typeParameters,
  option.parameters,
  option.type,
  option.equalsGreaterThanToken,
  option.body
)
export const createTypeReferenceNode = (typeName: string | ts.Identifier | ts.QualifiedName, typeArguments?: ts.TypeNode[]) => ts.createTypeReferenceNode(typeName, typeArguments)

type VariableDeclarationOption = {
  name: string | ts.BindingName,
  type?: ts.TypeNode,
  initializer?: ts.Expression
};
export const createVariableDeclaration = (option: VariableDeclarationOption) => ts.createVariableDeclaration(
  option.name,
  option.type,
  option.initializer
)

type VariableStatementOption = {
  modifiers?: ReadonlyArray<ts.Modifier>,
  declarationList: ts.VariableDeclarationList | ReadonlyArray<ts.VariableDeclaration>
};

export const createVariableStatement = (option: VariableStatementOption) => ts.createVariableStatement(
  option.modifiers,
  option.declarationList
)
type ParameterOption = {
  decorators?: ReadonlyArray<ts.Decorator>;
  modifiers?: ReadonlyArray<ts.Modifier>;
  dotDotDotToken?: ts.DotDotDotToken;
  name: string | ts.BindingName;
  questionToken?: ts.QuestionToken;
  type?: ts.TypeNode;
  initializer?: ts.Expression;
};

export const createParameter = (option: ParameterOption) => ts.createParameter(
  option.decorators,
  option.modifiers,
  option.dotDotDotToken,
  option.name,
  option.questionToken,
  option.type,
  option.initializer
)

type MethodOption = {
  decorators?: ReadonlyArray<ts.Decorator>;
  modifiers?: ReadonlyArray<ts.Modifier>;
  asteriskToken?: ts.AsteriskToken;
  name: string | ts.PropertyName;
  questionToken?: ts.QuestionToken;
  typeParameters?: ReadonlyArray<ts.TypeParameterDeclaration>;
  parameters: ReadonlyArray<ts.ParameterDeclaration>;
  type?: ts.TypeNode;
  body?: ts.Block;
};

export const createMethod = (options: MethodOption) => ts.createMethod(
  options.decorators,
  options.modifiers,
  options.asteriskToken,
  options.name,
  options.questionToken,
  options.typeParameters,
  options.parameters,
  options.type,
  options.body
)


type InterfaceOption = {
  decorators?: ReadonlyArray<ts.Decorator>;
  modifiers?: ReadonlyArray<ts.Modifier>;
  name: string | ts.Identifier;
  typeParameters?: ReadonlyArray<ts.TypeParameterDeclaration>;
  heritageClauses?: ReadonlyArray<ts.HeritageClause>;
  members: ReadonlyArray<ts.TypeElement>;
};

export const createInterface = (options: InterfaceOption) => ts.createInterfaceDeclaration(
  options.decorators,
  options.modifiers,
  options.name,
  options.typeParameters,
  options.heritageClauses,
  options.members
)


type ModuleOption = {
  decorators?: ReadonlyArray<ts.Decorator>,
  modifiers?: ReadonlyArray<ts.Modifier>,
  name: ts.ModuleName,
  body?: ts.ModuleBody,
  flags?: ts.NodeFlags
};

export const createModule = (option: ModuleOption) => ts.createModuleDeclaration(
  option.decorators,
  option.modifiers,
  option.name,
  option.body,
  option.flags
)


type PropertyOption = {
  decorators?: ReadonlyArray<ts.Decorator>,
  modifiers?: ReadonlyArray<ts.Modifier>,
  name: string | ts.PropertyName,
  questionOrExclamationToken?: ts.QuestionToken | ts.ExclamationToken,
  type?: ts.TypeNode,
  initializer?: ts.Expression
};

export const createProperty = (option: PropertyOption) => ts.createProperty(
  option.decorators,
  option.modifiers,
  option.name,
  option.questionOrExclamationToken,
  option.type,
  option.initializer
)

type PropertySignature = {
  modifiers?: ReadonlyArray<ts.Modifier>,
  name: ts.PropertyName | string,
  questionToken?: ts.QuestionToken,
  type?: ts.TypeNode,
  initializer?: ts.Expression
};

export const createPropertySignature = (options: PropertySignature) => ts.createPropertySignature(
  options.modifiers,
  options.name,
  options.questionToken,
  options.type,
  options.initializer
);



type CallSignatureOption = {
  typeParameters?: ReadonlyArray<ts.TypeParameterDeclaration>,
  parameters: ReadonlyArray<ts.ParameterDeclaration>,
  type?: ts.TypeNode
};

export const createCallSignature = (options: CallSignatureOption) => ts.createCallSignature(
  options.typeParameters,
  options.parameters,
  options.type
);

type FunctionDeclarationOption = {
  decorators?: ReadonlyArray<ts.Decorator>,
  modifiers?: ReadonlyArray<ts.Modifier>,
  asteriskToken?: ts.AsteriskToken,
  name?: string | ts.Identifier,
  typeParameters?: ReadonlyArray<ts.TypeParameterDeclaration>,
  parameters: ReadonlyArray<ts.ParameterDeclaration>,
  type?: ts.TypeNode,
  body?: ts.Block
};

export const createFunctionDeclaration = (option: FunctionDeclarationOption) => ts.createFunctionDeclaration(
  option.decorators,
  option.modifiers,
  option.asteriskToken,
  option.name,
  option.typeParameters,
  option.parameters,
  option.type,
  option.body
)


type TypeAliasDeclarationOption = {
  decorators?: ReadonlyArray<ts.Decorator>,
  modifiers?: ReadonlyArray<ts.Modifier>,
  name: string | ts.Identifier,
  typeParameters?: ReadonlyArray<ts.TypeParameterDeclaration>,
  type: ts.TypeNode
};


/**
 * ```
 *  modifiers(export)  decorators(@N)  type name<typeParameters> = type
 *   export          @N       type  name<T> =  {}
 *```
 */
export const createTypeAliasDeclaration = (option: TypeAliasDeclarationOption) => ts.createTypeAliasDeclaration(
  option.decorators,
  option.modifiers,
  option.name,
  option.typeParameters,
  option.type
)


export const addComment = <T extends ts.Node>(node: T, comment: string | undefined, isFull: boolean = false) => {

  if (comment) {
    let c = isFull ? comment.replace(/^(\/\*)|(\*\/)$/g, "") : `*${EOL} * ` + comment.split(EOL).join(`${EOL} * `) + `${EOL} `
    ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, c, true)
  }
  return node;
}

export const addComments = <T extends ts.Node>(node: T, comment: string[], isFull: boolean = false) => {
  comment.forEach(c => addComment(node, c, isFull))
}


export const parseComment = <T extends ts.Node>(node: T) => {
  let range = ts.getCommentRange(node) as any;
  if (range.jsDoc) {
    return (range.jsDoc as ts.JSDoc[]).map(n => {
      let s = n.getFullText().replace(/^(\/\*)|(\*\/)$/g, "");
      return s
        .split(EOL)
        .map(s => s.replace(/^\s{1,}|\s$/g, '').replace(/^\*/g, '').replace(/^\s/, ''))
        .filter(i => i != '' && i != "*")
        .join(EOL)
    })
  }
  return [];
}