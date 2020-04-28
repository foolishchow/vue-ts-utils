import { $ } from "@foolishchow/tsutil";
import * as fs from "fs";
import { dirname, relative, resolve, sep } from "path";
import * as ts from "typescript";
import { debounce } from "./debounce";
import { Watch, Glob } from "./glob-utils";
import { LoopMap, Template } from "./route-template";
import { EventEmitter } from "events";

export namespace VueRouteGen {
  export interface Import {
    file: string;
    name: string[]
  }
  export interface RouteEnum {
    fileName: string;
    constName: string,
    name: string,
    path: string,
    parent?: string,
    meta: any;
    show: boolean;
    sort: number;
  }
  export interface RouteTree {
    name: string,
    path: string,
    component: string;
    sort: number;
    show: boolean;
    meta?: any;
    children?: RouteTree[]
  }
}

const isSameExport = (from: PageConfig = {} as any, to: PageConfig = {} as any) => {
  return (
    from.pageName == to.pageName &&
    from.path == to.path &&
    from.title == to.title &&
    from.parent == to.parent &&
    from.show == to.show &&
    from.sort == to.sort &&
    from.meta == to.meta
  )
}

export interface RouteConfig {
  glob: string[],
  root: string,
  file: string
}

export interface PageConfig {
  pageName: string,
  path: string;
  title: string,
  parent?: string,
  show: boolean
  sort: number;
  meta: any;
}

export interface FileCache {
  fileName: string;
  lastModified: number;
  exports: PageConfig[]
}

export interface VuexParser {
  emit(name: "emit"): boolean;
  on(event: "emit", listener: (...args: any[]) => void): this;
  once(event: "emit", listener: (...args: any[]) => void): this;
}
export class Programer extends EventEmitter {

  cacher: Map<string, FileCache> = new Map();
  watcher: fs.FSWatcher;
  routeFile: string;
  routePath: string;

  constructor(
    private config: RouteConfig,
    private watch: boolean = true
  ) {
    super();
    this.routeFile = resolve(process.cwd(), config.file);
    this.routePath = dirname(this.routeFile);
    this.emit = debounce(this.emit, 500)
    this.init();
  }

  async init() {
    if (this.watch) {
      let watcher = Watch(this.config.glob);
      watcher.on("change", (path, stat) => {
        this.parseFile(path, Date.now())
      })
      watcher.on("add", (path, stat) => {
        // console.info("add", path)
        this.parseFile(path, Date.now())
      })
      watcher.on("unlink", (path, stat) => {
        // console.info("unlink", path)
        this.cacher.delete(path);
        this.emitFile();
      })
      // .on('addDir', path => console.log(`Directory ${path} has been added`))
      // .on('unlinkDir', path => console.log(`Directory ${path} has been removed`))

    } else {
      let files = await Glob(this.config.glob);
      files.forEach(file => this.parseFile(file, Date.now()));
    }
  }

  private resloveRoutePath(fileName: string, path: string = "") {
    let routePath = fileName.replace(this.config.root, "").replace(/\.tsx?$/, "").split(sep).join("/") + "/" + path;
    return routePath.replace(/\/+/g, "/").replace(/\/index\/?$/, "/")
  }

  private parseFile(fileName: string, time: number) {
    let content = fs.readFileSync(resolve(process.cwd(), fileName)).toString()
    let sourcefile = ts.createSourceFile(fileName, content, ts.ScriptTarget.ESNext);
    let pageConfigs: PageConfig[] = $(sourcefile).find("ClassDeclaration").map(node => {
      let ClassDeclaration: ts.ClassDeclaration = node as any;
      if (isExported(ClassDeclaration) && ClassDeclaration.decorators) {
        let name = (ClassDeclaration.name)
        if (name) {
          let tags = parseJsDoc(ClassDeclaration)
          if (tags.show == undefined) tags.show = true;
          if (tags.ignore || !tags.title) {
            this.cacher.delete(fileName);
          } else {
            let config: PageConfig = {
              path: tags.path ? tags.path.toString() : this.resloveRoutePath(fileName, (tags.path || "").toString()),
              pageName: name.text,
              title: (tags.title || "").toString(),
              show: tags.show as any,
              sort: (tags as any).sort || 255,
              meta: new Function(`return ${tags.meta || "{}"}`)()
            }
            if (tags.parent) {
              config.parent = tags.parent.toString();
            }
            return config;
          }
        }
      }
    }).filter(s => s) as PageConfig[]

    if (pageConfigs.length > 0) {
      let config: FileCache = {
        fileName,
        lastModified: time,
        exports: pageConfigs!
      }
      let cache = this.cacher.get(fileName);
      if (cache != undefined) {
        if (cache.exports.every((i, index) => isSameExport(config.exports[index], i))) {
          return;
        }
      }
      this.cacher.set(fileName, config);
      this.emitFile();
    }

  }

  private importPath(filename: string) {
    let path = relative(this.routePath, resolve(process.cwd(), filename)).replace(/\.tsx?$/, '');
    if (!path.startsWith('.')) {
      path = './' + path
    }
    return path.replace(/\/index$/, "");
  }


  private RouteNames = new Set<string>();
  private CachedNames = new Map<string, string>();
  private getConstName(name: string, constName?: string): string {
    if (!constName) constName = name;
    if (this.RouteNames.has(constName)) {
      return this.getConstName(name, constName + "_1")
    }
    this.CachedNames.set(name, constName);
    this.RouteNames.add(constName);
    return name;
  }
  private emitFile() {
    this.RouteNames = new Set<string>();
    this.CachedNames = new Map<string, string>();

    let Import: VueRouteGen.Import[] = [];
    let RoutePath: VueRouteGen.RouteEnum[] = [];
    LoopMap(this.cacher, (key, item) => {
      Import.push({
        file: this.importPath(item.fileName),
        name: item.exports.map(e => this.getConstName(e.pageName))
      })
    });
    LoopMap(this.cacher, (key, item) => {
      item.exports.forEach(route => {
        RoutePath.push({
          fileName: item.fileName,
          name: route.title,
          constName: this.CachedNames.get(route.pageName)!,
          path: route.path,
          parent: route.parent ? this.CachedNames.get(route.parent)! : undefined,
          show: route.show,
          meta: route.meta,
          sort: route.sort
        })
      })
    })

    let AppRoute = this.generateRoute(RoutePath)

    let content = Template(Import, RoutePath, AppRoute.route, AppRoute.menu)

    fs.writeFileSync(this.routeFile, content);
    this.emit("emit");
  }

  private generateRoute(RoutePath: VueRouteGen.RouteEnum[]) {
    RoutePath = JSON.parse(JSON.stringify(RoutePath));

    const RoutePaths: { [x: string]: string } = {}
    const Routes: { [x: string]: VueRouteGen.RouteTree } = {};
    const rootRoute: VueRouteGen.RouteTree[] = [];

    const MenuRoutes: { [x: string]: any } = {};


    RoutePath.forEach(item => {
      if (item.path != "" && !item.parent) {
        let parent = RoutePath
          .filter(route => route.path != "/")
          .filter(route => (item.path != route.path && item.path.startsWith(route.path)))
          .sort((a, b) => b.path.length - a.path.length);
        if (parent.length > 0) {
          item.parent = parent[0].constName
        }
      }

      // cache route path by name
      RoutePaths[item.constName] = item.path;
      Routes[item.constName] = ({
        sort: item.sort,
        show: item.show,
        name: item.name,
        path: item.path,
        meta: item.meta,
        component: `class ${item.constName} {}`
      })
      if (item.show) {
        MenuRoutes[item.constName] = ({
          name: item.name,
          path: item.path
        })
      }
    })

    RoutePath
      .filter(e => e.parent)
      .forEach(e => {
        let parentName = e.parent,
          childName = e.constName,
          parenetPath = RoutePaths[parentName!],
          childPath = RoutePaths[childName!],
          child = Routes[childName],
          parent = Routes[parentName!];

        child.path = childPath;
        (parent.children || (parent.children = [])).push(child);
        parent.children.sort((a, b) => a.sort - b.sort);
        if (child.show) {
          let MenuParent = MenuRoutes[parentName!];
          if (MenuParent) {
            (MenuParent.children || (MenuParent.children = [])).push(MenuRoutes[childName]);
          }
        }
      })

    RoutePath.filter(e => !e.parent)
      .forEach(item => {
        rootRoute.push(Routes[item.constName])
      });
    rootRoute.sort((a, b) => a.sort - b.sort)

    // RoutePath.filter(e => !e.parent && e.show)
    //   .forEach(item => {
    //     RootMenuRoutes.push(MenuRoutes[item.constName])
    //   })

    let route = JSON.stringify(rootRoute, (key: string, value: any) => {
      if (value.sort) {
        // value.meta = value.meta || {};
        // value.meta.Sort = value.sort
        // delete value.sort
        return value;
      }
      if (key == "sort") return undefined;
      if (key == "show") return undefined;
      return value;
    }, 4);
    let menuRoute = JSON.stringify(rootRoute.filter(s => s.show), (key: string, value: any) => {
      if (value.children) {
        value.children = value.children.filter((c: any) => c.show)
      }
      if (value.show == false) {
        return undefined;
      }
      if (key == "component") return undefined;
      return value;
    }, 4);
    return {
      route: route.replace(/"class\s(\w+)\s{}"/g, (w, $1) => $1),
      menu: menuRoute.replace(/"class\s(\w+)\s{}"/g, (w, $1) => $1),
    }
  }
}


const isExported = (node: ts.Node) => {
  return node.modifiers && node.modifiers.some(s => s.kind == ts.SyntaxKind.ExportKeyword)
}

const parseJsDoc = (node: ts.Node) => {
  // @ts-ignore
  if (!node.jsDoc) return {};
  let docs = (node as any).jsDoc as ts.JSDoc[];
  let result: { [x: string]: string | boolean | number } = {};
  docs.forEach(doc => {
    if (doc.tags) doc.tags.forEach(tag => {
      let name = tag.tagName.text;
      let value = tag.comment || "";
      if (name == "show") {
        result[name] = value == "false" ? false : true;
      } else if (name == "ignore") {
        result[name] = true;
      } else {
        result[name] = value;
      }
    })
  })
  return result;
}


// Start the watcher
process.on("uncaughtException", e => {
  console.info(e)
})