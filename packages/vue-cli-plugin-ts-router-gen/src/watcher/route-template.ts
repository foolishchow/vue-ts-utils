import { EOL } from "os";
import { VueRouteGen } from "./index"

export const LoopMap = <K, V>(map: Map<K, V>, cb: (key: K, item: V) => void) => {
  let keys = map.keys();
  let current = keys.next();
  while (!current.done) {
    let key = current.value;
    let config = map.get(key)!
    cb(key, config);
    current = keys.next();
  }
}

const genImport = (_import: VueRouteGen.Import) => `import {${_import.name.join(",")}} from "${_import.file}";`;
const genRoutePath = (Enum: VueRouteGen.RouteEnum) => `  /**
   * ${Enum.name}
   * @file ${Enum.fileName}
   */
  ${Enum.constName} = "${Enum.path}",`;

export const Template = (
  imports: VueRouteGen.Import[],
  RouteEnum: VueRouteGen.RouteEnum[],
  AppRoute: string,
  MenuRoute: string
) => {

  return `/**
 * this file is auto generated
 * don't modify by hand
 */
import Vue from "vue";
import VueRouter,{RouteConfig} from "vue-router";
${imports.map(_import => genImport(_import)).join(EOL)}

Vue.use(VueRouter);

enum AppRoutePath {
${RouteEnum.map(genRoutePath).join(EOL)}
};

export const AppRoutes:RouteConfig[] =  ${AppRoute};
export type RouterMenus = {
  sort: number|string;
  show: boolean;
  name: string;
  path: string;
  children?:RouterMenus[];
  meta:any,
  extra?:any
}
export const AppMenuRoutes:RouterMenus[] = ${MenuRoute};

Object.defineProperty(Vue.prototype, "$AppRoutes", {
  get() {
    return AppRoutePath;
  }
});

declare module "vue/types/vue" {
  interface Vue {
    $AppRoutes: typeof AppRoutePath;
  }
}
`;
}