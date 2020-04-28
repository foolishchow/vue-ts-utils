import { createModule } from "@foolishchow/tsutil";
import { appendFileSync, writeFileSync } from "fs";
import { EOL } from "os";
import * as ts from "typescript";
import { ServiceOption, WebpackAlias } from "../watcher";
import { debounce } from "../watcher/debounce";
import { CodeHelper } from "./code-helper";
import { ImportHelper } from "./import-helper";
import { NameHelper } from "./name-helper";
import { Parse } from "./parse";
import { PathHelper } from "./path-helper";
import { ReferenceHelper } from "./reference-helper";
import { EventEmitter } from "events";


/* @internal */
export interface VuexParserKeel {
  existImports: ImportHelper.Import[];
  existVariableNames: Set<string>;
  moduleNames: Set<string>;
  modules: string[];
  Modules: ts.ModuleDeclaration[],
  Getters: ts.PropertyDeclaration[];
  Dispatchs: ts.CallSignatureDeclaration[];
  InnerDispatchs: ts.CallSignatureDeclaration[];
  DispatchPayloads: ts.TypeAliasDeclaration[];
  EnhancedDispatch: ts.VariableStatement[];
  Commits: ts.CallSignatureDeclaration[];
  InnerCommits: ts.CallSignatureDeclaration[];
  EnhancedCommit: ts.VariableStatement[];
  CommitPayloads: ts.TypeAliasDeclaration[];
  declareMigrations: ts.ModuleDeclaration[];
}
export interface VuexParser {
  emit(name: "emit"): boolean;
  on(event: "emit", listener: (...args: any[]) => void): this;
  once(event: "emit", listener: (...args: any[]) => void): this;
}
/* @internal */
export class VuexParser extends EventEmitter {

  private files: ts.MapLike<Parse.FileInfo> = {}
  private resultFile: ts.SourceFile;
  private printer: ts.Printer;
  private names: NameHelper;
  codeHelper: CodeHelper;
  constructor(
    private options: Required<ServiceOption>,
    private alias: WebpackAlias
  ) {
    super();
    this.names = new NameHelper(options);
    this.codeHelper = new CodeHelper(this.names)
    this.generateFiles = debounce(this.generateFiles, 200);
    this.resultFile = ts.createSourceFile(
      "api.ts",
      "",
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ false,
      ts.ScriptKind.TS
    );
    this.printer = ts.createPrinter({
      newLine: ts.NewLineKind.CarriageReturnLineFeed
    });
  }

  /**
   *
   * @param node
   */
  private print(node: ts.Node | ts.Node[]): string {
    if (Array.isArray(node)) {
      return node.map(n => this.print(n)).join(EOL)
    } else {
      return this.printer.printNode(
        ts.EmitHint.Unspecified,
        node,
        this.resultFile
      )
    }

  }

  /**
   *
   */
  private generateFiles() {
    let keel: VuexParserKeel = this.generateKeel();
    let body = this.importModules(keel);
    let fileNames = Object.keys(this.files);

    fileNames.forEach(fileName => {
      this.generateFile(fileName, keel);
    })


    let imports: ts.Node[] = this.codeHelper.createImports(keel.existImports)
    body = imports.concat(body);
    let useVuex = this.codeHelper.VueUseVuex();
    let FVuexStoreType = this.codeHelper.FVuexStoreType();
    let init = this.codeHelper.FVuexInit();
    body.push(useVuex);
    body.push(FVuexStoreType);
    body.push(init);

    let storeBody = this.codeHelper.createKeel(
      keel.modules,
      keel.Getters,
      keel.Dispatchs,
      keel.InnerDispatchs,
      keel.DispatchPayloads,
      keel.Commits,
      keel.InnerCommits,
      keel.CommitPayloads
    )

    body.push(storeBody);

    body.push(createModule({
      flags: ts.NodeFlags.Namespace,
      name: ts.createIdentifier("Dispatchs"),
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      body: ts.createModuleBlock(keel.EnhancedDispatch as any)
    }))
    body.push(createModule({
      flags: ts.NodeFlags.Namespace,
      name: ts.createIdentifier("Commits"),
      modifiers: [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      body: ts.createModuleBlock(keel.EnhancedCommit as any)
    }))
    writeFileSync(this.options.file, EOL + this.print(body))
    appendFileSync(this.options.file, EOL + this.print(keel.Modules))
    appendFileSync(this.options.file, EOL + this.print(keel.declareMigrations))
    this.emit("emit")
  }

  private importModules(keel: VuexParserKeel) {
    let body: ts.Node[] = [];
    let Modules = ts.createVariableDeclarationList([
      ts.createVariableDeclaration(
        this.names.ConstName,
        ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        ts.createObjectLiteral()
      )
    ], ts.NodeFlags.Const);
    body.push(Modules);
    Parse.Loop(this.files, (fileName, file, index) => {
      let importPath = PathHelper.declarePath(fileName, this.options.file);
      file.Modules.forEach(m => {
        if (!m.import) m.import = {
          type: "named",
          current: m.className,
          file: importPath
        }
        ImportHelper.MergeImport(m.import!, keel, []);
        let call = ts.createCall(ts.createIdentifier("FVuex.addModule"), undefined, [
          this.names.ConstNameIdentifier,
          ts.createStringLiteral(m.name),
          ts.createIdentifier(m.import!.current)
        ])
        body.push(call);
      })
    })
    return body;
  }


  /**
   *
   * @param fileName
   * @param generated
   */
  private generateFile(fileName: string, generated: VuexParserKeel) {
    let fileInfo = this.files[fileName];

    if (fileInfo.changed == false) {
      fileInfo.changed = fileInfo.imports.some(imp => ImportHelper.CheckImportConflict(imp, generated))
    }


    if (fileInfo.changed) {
      // console.info(`${fileName} changed`)
      let imports = fileInfo.imports;
      imports.forEach((imp, index) => {
        let originName = imp.current;
        let leftImports = (([] as ImportHelper.Import[]).concat(imports)).splice(index + 1)
        let result = ImportHelper.MergeImport(imp, generated, leftImports);
        if (result) {
          ReferenceHelper.TransformFileInfo(originName, result!, fileInfo)
        }
      })
      let cache: Parse.FileGenerateCache = {
        moduleCachesInRoot: [],
        modules: []
      }
      fileInfo.Modules.forEach(m => {
        let moduleGened = this.codeHelper.createModule(m)
        cache.modules.push(moduleGened);
        let cacheInRoot = this.codeHelper.createModuleCacheInRoot(m);
        cache.moduleCachesInRoot.push(cacheInRoot);
      })

      let declarePath = PathHelper.declarePath(fileName, this.options.file);
      cache.declareMigration = this.codeHelper.createFileDeclareMigration(fileInfo, declarePath);
      fileInfo.cache = cache;
    } else {
      // console.info(`${fileName} using Cache`)
      let imports = fileInfo.imports;
      imports.forEach((imp) => {
        ImportHelper.MergerImportIgnoreOnConflict(imp, generated);
      })
    }

    fileInfo.Modules.forEach(m => {
      generated.modules.push(m.name)
    })

    fileInfo.cache.moduleCachesInRoot.forEach(cache => {
      generated.EnhancedCommit = generated.EnhancedCommit.concat(cache.EnhancedCommit)
      generated.InnerCommits = generated.InnerCommits.concat(cache.InnerCommit)
      generated.InnerDispatchs = generated.InnerCommits.concat(cache.InnerDispatch)
      generated.EnhancedDispatch = generated.EnhancedDispatch.concat(cache.EnhancedDispatch)
      generated.Getters = generated.Getters.concat(cache.Getters);
      generated.DispatchPayloads = generated.DispatchPayloads.concat(cache.DispatchPayloads);
      generated.Dispatchs = generated.Dispatchs.concat(cache.Dispatch);
      generated.Commits = generated.Commits.concat(cache.Commit);
      generated.CommitPayloads = generated.CommitPayloads.concat(cache.CommitPayload);
    })
    fileInfo.cache.modules.forEach(mod => {
      generated.Modules.push(mod);
    })
    if (fileInfo.cache.declareMigration) generated.declareMigrations.push(fileInfo.cache.declareMigration);
    fileInfo.changed = false;

  }


  /**
   *
   */
  private generateKeel(): VuexParserKeel {
    let existImports: ImportHelper.Import[] = [{
      file: "vue",
      type: "normal",
      current: "Vue"
    }, {
      file: "vuex",
      type: "normal",
      current: "Vuex"
    }, {
      file: "@foolishchow/vuex",
      type: "named",
      current: "FVuex"
    }];
    let moduleNames = Parse.Reduce(this.files, (prev, key, item) => {
      item.Modules.forEach(m => {
        prev.add(m.name);
      })
      return prev
    }, new Set<string>())

    return {
      Modules: [],
      moduleNames,
      existVariableNames: new Set<string>(["Vue", "Vuex", "FVuex"]),
      existImports,
      Getters: [],
      Dispatchs: [],
      DispatchPayloads: [],
      Commits: [],
      InnerCommits: [],
      InnerDispatchs: [],
      CommitPayloads: [],
      modules: [],
      declareMigrations: [],
      EnhancedCommit: [],
      EnhancedDispatch: []
    }
  }

  addFile(fileName: string, sourceFile: ts.SourceFile, sourceDtsFile: ts.SourceFile) {
    this.files[fileName] = Parse.parse(this.options, this.alias, fileName, sourceFile, sourceDtsFile);
    this.generateFiles();
  }

  deleteFile(fileName: string) {
    delete this.files[fileName];
    this.generateFiles();
  }

}


