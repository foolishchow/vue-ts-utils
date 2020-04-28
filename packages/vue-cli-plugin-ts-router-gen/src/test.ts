import { Programer, RouteConfig } from "./watcher"

process.title = "vue-cli-plugin-vuex-gen"
let cwd = ""
process.chdir(cwd);

let config: RouteConfig = {
  glob: ["src/pages/**/*.+(ts|tsx)"],
  root: "src/pages",
  file: "src/router.ts"
};
new Programer(config, true)