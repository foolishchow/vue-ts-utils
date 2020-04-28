
import * as ts from "typescript";
import { findNode } from "./parser/visit";

const s = `export class Name extends Vue<aaaa>{
  private name:string = "1";
}`

let sourceFile = ts.createSourceFile("api.ts", s, ts.ScriptTarget.ESNext)

findNode(sourceFile)


setInterval(() => {

}, 30000)