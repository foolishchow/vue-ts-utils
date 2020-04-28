import { Service, ServiceOption, WebpackAlias } from "./watcher"
import Config from "webpack-chain"
import BuildPlugin from "./webpack"
function Api(config: ServiceOption, alias: WebpackAlias = {}) {
  let api = config as any;
  // initer for @vue/cli
  if (api.configureWebpack && alias) {
    initVueCli(config, alias)
  } else {
    // initer for node
    new Service(config, alias)
  }
}

function initVueCli(api: any, projectOptions: any) {
  let env = process.env.NODE_ENV as ("development" | "production");
  if (env != "development") {
    api.chainWebpack((config: Config) => {
      let opt = projectOptions.pluginOptions.vuexGen || projectOptions.pluginOptions.vuexgen;
      let alias = config.resolve.alias || {};
      config.plugin("vuex-generate")
        .use(BuildPlugin, [opt, alias])
    })
  } else {
    api.configureWebpack((webpackConfig: any) => {
      try {
        let opt = projectOptions.pluginOptions.vuexGen || projectOptions.pluginOptions.vuexgen
        if (opt) new Service(opt, webpackConfig.resolve.alias || {})
      } catch (e) {
        console.error(`Failed to start vuex-gen ${e.stack}`)
      }
    })
  }

}
export = Api;

if (require.main == module) {
  try {
    require("./test")
  } catch (error) {

  }
}