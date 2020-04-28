import { $ } from "@foolishchow/tsutil";
import * as ts from "typescript";
import { VuexParserKeel } from ".";
import { WebpackAlias } from "../watcher";
import { PathHelper } from "./path-helper";


export namespace ImportHelper {

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




  function isSameImport(from: Import, to: Import) {
    if (from.file == to.file) {
      if (from.type == to.type) {
        if (from.type == "named") return from.origin == (to as NamedImport).origin;
        return true;
      }
    }
    return false;
  }

  function getNewName(name: string, exists: Set<string>, moduleNames: Set<string>, left: Import[], suffix: number = 1): string {
    let newName = `${name}_${suffix}`;
    if (moduleNames.has(newName) || exists.has(newName) || left.some(i => i.current == newName)) {
      return getNewName(name, exists, moduleNames, left, suffix + 1);
    }
    return newName;
  }
  /*
    import {read} from "fs";
    import * as read from "ts";
    import read from "ss";
  */
  export function MergeImport(imp: Import, generated: VuexParserKeel, leftImports: Import[]) {
    if (generated.moduleNames.has(imp.current)) {
      let originName = imp.current;
      let newName = getNewName(imp.current, generated.existVariableNames, generated.moduleNames, leftImports);
      let newImport = {
        ...imp,
        current: newName
      }
      imp.current = newName;
      if (newImport.type == "named" && !newImport.origin) {
        newImport.origin = originName;
        (imp as NamedImport).origin = originName;
      }
      generated.existImports.push(newImport)
      generated.existVariableNames.add(newName);
      return newName;
    } else if (generated.existVariableNames.has(imp.current)) {
      let crushed = generated.existImports.filter(i => i.current == imp.current)[0];
      let isSame = isSameImport(crushed, imp);
      if (isSame) return;
      let originName = imp.current;
      let newName = getNewName(imp.current, generated.existVariableNames, generated.moduleNames, leftImports);
      let newImport = {
        ...imp,
        current: newName
      }
      imp.current = newName;
      if (newImport.type == "named" && !newImport.origin) {
        newImport.origin = originName;
        (imp as NamedImport).origin = originName;
      }
      generated.existImports.push(newImport)
      generated.existVariableNames.add(newName)
      return newName;
    } else {
      generated.existImports.push(imp)
      generated.existVariableNames.add(imp.current)
      return;
    }
  }

  export function MergerImportIgnoreOnConflict(imp: Import, generated: VuexParserKeel) {
    if (generated.moduleNames.has(imp.current)) {
      return;
    } else if (generated.existVariableNames.has(imp.current)) {
      return;
    } else {
      generated.existImports.push(imp)
      generated.existVariableNames.add(imp.current)
    }
  }

  export function CheckImportConflict(imp: Import, generated: VuexParserKeel) {
    if (generated.moduleNames.has(imp.current)) {
      return true;
    } else if (generated.existVariableNames.has(imp.current)) {
      let crushed = generated.existImports.filter(i => i.current == imp.current)[0];
      let isSame = isSameImport(crushed, imp);
      if (isSame) return false;
      return true;
    } else {
      return false;
    }
  }


  export function parseImport(fileName: string, sourceFile: ts.SourceFile, alias: WebpackAlias, mainFile: string): Import[] {
    let Imports: Import[] = [];
    $(sourceFile).find("ImportDeclaration").map((node) => {
      let file = PathHelper.getFilePath(fileName, alias, node.moduleSpecifier.getText(), mainFile);
      if (file == false) return;
      let ImportClauses = $(node).find("ImportClause").self;
      ImportClauses.forEach(i => {
        let namedBindings = i.namedBindings;
        if (!namedBindings) return;
        if (i.name) {
          Imports.push({
            file,
            type: "normal",
            current: i.name!.escapedText as string
          })
        }
        if (ts.isNamespaceImport(namedBindings)) {
          // import * as ts from "typescript"
          Imports.push({
            file,
            type: "namespace",
            current: namedBindings.name.escapedText as string
          })
        } else if (ts.isNamedImports(namedBindings)) {
          // import {readFileSync} from "fs"
          namedBindings.elements.forEach(e => {
            let i: Import = {
              file,
              type: "named",
              current: e.name.escapedText as string
            }
            // import {readFileSync as propertyName} from "fs"
            if (e.propertyName) {
              i.origin = e.propertyName.escapedText as string
              i.current = e.name.escapedText as string;
            }
            Imports.push(i);
          })
        }
      })
    })
    return Imports;
  }
}

