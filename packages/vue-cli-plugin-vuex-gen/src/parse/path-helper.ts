import fs from "fs";
import { basename, dirname, isAbsolute, normalize, relative, resolve } from "path";
import { WebpackAlias } from "../watcher";


export namespace PathHelper {
  const suffix = ['.ts', '.tsx', ".js", '.jsx', "/index.ts", "/index.tsx", "/index.js", "/index.jsx"]
  const suffixLength = suffix.length
  /**
   * @example
   *  camel("index_file")=>"IndexFile"
   */
  export function camel(name: string) {
    return name.replace(/^\w/, w => w.toUpperCase()).replace(/_\w/g, w => w.toUpperCase().substr(1))
  }
  /**
   * 获取文件名
   * @param name
   * @example
   *  FileName("src/main/index.tsx") => "index"
   */
  export function FileName(name: string) {
    return basename(name).replace(/\.tsx?$/g, '')
  }

  function isValidImport(filePath: string, mainFile: string) {
    let ext = /\.(ts|tsx|js|jsx)/.test(filePath);
    if (ext) {
      if (fs.existsSync(filePath)) {
        return filePath != mainFile;
      }
      // return fs.existsSync(filePath);
    }
    let index = 0,
      f = "",
      valid = false;
    while (index < suffixLength && !valid) {
      valid = fs.existsSync(filePath + suffix[index]);
      if (valid) f = normalize(filePath + suffix[index])
      index++;
    }

    if (valid && f != mainFile) {
      let path = f.replace(/\.(tsx?|jsx?)$/, '').replace(/\/index$/, '');
      path = relative(dirname(mainFile), path);
      if (!/^\./.test(path)) path = "./" + path;
      return path;
    }
    return false;
  }

  export function getFilePath(fileName: string, alias: WebpackAlias, importPath: string, mainFile: string) {
    importPath = importPath.replace(/^("|')|("|')$/g, "");
    let keys = Object.keys(alias);
    let resolvedFileName = "", index = 0;
    while (resolvedFileName == "" && index < keys.length) {
      let aliaKey = keys[index];
      if (importPath.startsWith(aliaKey)) {
        let filePath = alias[aliaKey] + "/" + importPath.replace(aliaKey, '');
        let valid = isValidImport(filePath, mainFile)
        if (valid) {
          resolvedFileName = valid as any;
        }
      }
      index++;
    }
    if (resolvedFileName == "" && importPath.startsWith(".")) {
      let valid = isValidImport(resolve(dirname(fileName), importPath), mainFile);
      return valid as any;
    }
    return importPath;
  }


  export function declarePath(filepath: string, mainFile: string) {
    if (!isAbsolute(filepath)) filepath = resolve(process.cwd(), filepath);
    let _relative = relative(dirname(mainFile), filepath).replace(/\.(tsx?|jsx?)$/, '').replace(/\/index$/, '');;
    if (!/^\./.test(_relative)) _relative = "./" + _relative;
    return _relative;
  }
}