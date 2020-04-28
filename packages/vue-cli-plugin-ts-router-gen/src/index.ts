import { Programer } from "./watcher"



class VueRouterGeneratePlugin {
  constructor(
    private options: any,
  ) { }

  apply(compiler: any) {
    if ('hooks' in compiler) {
      // @ts-ignore
      compiler.hooks.run.tapAsync("vue-cli-plugin-vuex-gen", (compilation, callback) => {
        let service = new Programer(this.options, false);
        service.once("emit", () => {
          callback()
        })
      })
    } else {
      // @ts-ignore
      compiler.plugin('run', (compilation, callback) => {
        let service = new Programer(this.options, false);
        service.once("emit", () => {
          callback()
        })
      })
    }
  }
}

module.exports = (api: any, projectOptions: any) => {

  let env = process.env.NODE_ENV as ("development" | "production");
  if (env != "development") {
    api.chainWebpack((config: any) => {
      let opt = projectOptions.pluginOptions.routerGen || projectOptions.pluginOptions.routergen
      config.plugin("vue-router-generate")
        .use(VueRouterGeneratePlugin, [opt])
    })
  } else {
    api.configureWebpack((webpackConfig: any) => {
      if (webpackConfig.mode == "development") {
        try {
          new Programer(projectOptions.pluginOptions.routerGen || projectOptions.pluginOptions.routergen)
        } catch (e) {
          console.error(`Failed to start route-gen ${e.stack}`)
        }
      }
    })
  }



}


