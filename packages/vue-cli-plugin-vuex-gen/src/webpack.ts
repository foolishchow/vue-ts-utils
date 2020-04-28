import Webpack = require("webpack");
import { ServiceOption, WebpackAlias, Service } from "./watcher";


class VuexGeneratePlugin {
  constructor(
    private options: ServiceOption,
    private alias: WebpackAlias
  ) { }

  apply(compiler: Webpack.Compiler) {
    if ('hooks' in compiler) {
      compiler.hooks.run.tapAsync("vue-cli-plugin-vuex-gen", (compilation, callback) => {
        let service = new Service(this.options, this.alias, false);
        service.once("emit", () => {
          callback()
        })
      })
    } else {
      // @ts-ignore
      compiler.plugin('run', (compilation, callback) => {
        let service = new Service(this.options, this.alias, false);
        service.once("emit", () => {
          callback()
        })
      })
    }
  }
}

export = VuexGeneratePlugin