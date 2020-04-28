import { ServiceOption, Service } from "./watcher";

process.title = "vue-cli-plugin-vuex-gen"
let cwd = "/Users/zhoupeng/Desktop/Fireweed-code/fireweed-admin"
try {
  process.chdir(cwd);
} catch (error) {
  cwd = "/Users/hackintosh-01/Desktop/Fireweed-code/fireweed-web"
  process.chdir(cwd);
}
let alias = {
  '@': cwd + '/src',
  'vue$': 'vue/dist/vue.runtime.esm.js',
  components: cwd + '/src/components',
  config: cwd + '/src/config',
  interface: cwd + '/src/interface',
  internal: cwd + '/src/internal',
  pages: cwd + '/src/pages',
  wrap: cwd + '/src/wrap'
};
let config: ServiceOption = {
  glob: ["src/store/**/*.ts"],
  file: "src/vuex.ts",
  store: "FireweedAdminStore"
};
new Service(config, alias)