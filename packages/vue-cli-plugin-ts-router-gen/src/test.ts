import { Programer, RouteConfig } from "./watcher"

process.title = "vue-cli-plugin-vuex-gen"
let cwd = "/Users/zhoupeng/Desktop/Fireweed-code/fireweed-admin"
try {
  process.chdir(cwd);
} catch (error) {
  cwd = "/Users/hackintosh-01/Desktop/Fireweed-code/fireweed-admin"
  process.chdir(cwd);
}

let config: RouteConfig = {
  glob: ["src/pages/**/*.+(ts|tsx)"],
  root: "src/pages",
  file: "src/router.ts"
};
new Programer(config, true)