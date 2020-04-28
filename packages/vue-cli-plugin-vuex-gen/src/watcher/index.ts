import * as ts from "typescript";
import * as fs from "fs";

import { VuexParser } from "../parse";
import { tsquery } from "@phenomnomnominal/tsquery";
import { FileWatcher } from "./file-watch";
import { isAbsolute, resolve } from "path";
import { EventEmitter } from "events";
import { Glob } from "./glob-utils";

export const transformCompileOptions: ts.CompilerOptions = {
  experimentalDecorators: true,
  noEmitOnError: true,
  removeComments: false
}


export type WebpackAlias = ts.MapLike<string>;
export interface ServiceOption {
  glob: string[];
  file: string;
  /**
   * module decorator name
   * @default "FVuex.Module"
   */
  Module?: string[];
  /**
   * Action decorator name
   * @default "FVuex.Action"
   */
  Action?: string[];
  /**
   * Mutation decorator name
   * @default "FVuex.Mutation",
   */
  Mutation?: string[];
  /**
   * Name of Vuex.Store
   * @default  "FWStore",
   */
  store?: string;
}

const DefaultServiceOption = {
  Module: ["FVuex.Module"],
  Action: ["FVuex.Action"],
  Mutation: ["FVuex.Mutation"],
  store: "Store",
}
export class Service extends EventEmitter {

  services: ts.LanguageService;
  servicesHost: ts.LanguageServiceHost;
  fileNames: Set<string> = new Set<string>();
  fileVersions: ts.MapLike<{ version: number }> = {};
  fileWatcher: FileWatcher;
  vuexParser: VuexParser;
  options: Required<ServiceOption>;
  constructor(
    options: ServiceOption,
    private alias: WebpackAlias,
    private watch: boolean = true
  ) {
    super();
    if (!isAbsolute(options.file)) {
      options.file = resolve(process.cwd(), options.file)
    }
    this.options = Object.assign(DefaultServiceOption, options)
    this.createLanguageHost();
    this.vuexParser = new VuexParser(this.options, alias)
    if (this.watch) {
      this.createWatcher()
    } else {
      this.generateFile();
    }
  }

  private async generateFile() {
    let files = await Glob(this.options.glob);
    files.forEach(file => {
      this.fileNames.add(file);
      this.fileVersions[file] = { version: 0 };
      this.emitFile(file)
    });
    this.vuexParser.once('emit', () => {
      this.emit("emit");
      try {
        this.services.dispose();
      } catch (error) {

      }
    });
  }

  private createWatcher() {
    this.fileWatcher = new FileWatcher(this.options.glob)
    this.fileWatcher.on("add", (file) => {
      this.fileNames.add(file);
      this.fileVersions[file] = { version: 0 };
      this.emitFile(file)
    })
    this.fileWatcher.on("change", (file) => {
      this.fileVersions[file].version++;
      this.emitFile(file)
    })
    this.fileWatcher.on("unlink", (file) => {
      this.fileNames.delete(file);
      this.deleteFile(file);
    })
  }

  createLanguageHost() {
    this.servicesHost = {
      getScriptFileNames: () => Array.from(this.fileNames),
      getScriptVersion: fileName => this.fileVersions[fileName] && this.fileVersions[fileName].version.toString(),
      getScriptSnapshot: fileName => {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => transformCompileOptions,
      getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory
    };
    this.services = ts.createLanguageService(this.servicesHost, ts.createDocumentRegistry())
  }

  deleteFile(fileName: string) {
    this.vuexParser.deleteFile(fileName)
  }

  emitFile(fileName: string) {
    let Program = this.services.getProgram()!;
    let outPut = this.services.getEmitOutput(fileName, true);
    let file = getDtsFile(outPut);
    if (!file) {
      return;
    }
    let sourceFile = Program.getSourceFile(fileName)!;
    global.TypeChecker = Program.getTypeChecker();
    this.vuexParser.addFile(fileName, sourceFile, tsquery.ast(file.text, file.name))
  }

}

declare global {
  namespace NodeJS {
    export interface Global {
      TypeChecker: ts.TypeChecker;
    }
  }
}

function getDtsFile(outPut: ts.EmitOutput) {
  let file = outPut.outputFiles.filter(e => /\.d\.ts$/.test(e.name));
  if (file.length > 0) {
    return file[0]
  }
}