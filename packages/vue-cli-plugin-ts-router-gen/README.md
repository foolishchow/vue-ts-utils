# vue-cli-plugin-ts-router-gen

> generate vue router file by file structure 

<p>
    <a href="https://www.npmjs.com/package/@foolishchow/vue-cli-plugin-ts-router-gen">
        <img src="https://img.shields.io/npm/v/@foolishchow/vue-cli-plugin-ts-router-gen.svg" alt="Version">
    </a> 
    <a href="https://www.npmjs.com/package/@foolishchow/vue-cli-plugin-ts-router-gen">
        <img src="https://img.shields.io/npm/dm/@foolishchow/vue-cli-plugin-ts-router-gen.svg" alt="Downloads">
    </a>
    <a href="https://www.npmjs.com/package/@foolishchow/vue-cli-plugin-ts-router-gen">
        <img src="https://img.shields.io/npm/dw/@foolishchow/vue-cli-plugin-ts-router-gen.svg" alt="Downloads">
    </a>
</p>
## install

```
yarn add @foolishchow/vue-cli-plugin-ts-router-gen
```

## example  
see [ts-router-gen-example](https://github.com/foolishchow/ts-router-gen-example)   

## comment option you can use
```typescript
/**
 * @title [string]  this is my page title
 * @ignore [boolean] wether this is component is ignored
 * @sort  [number] sort value for slibing sort, default is 255
 * @path  [string] do not use filePath for router path , custom it by  self
 * @parent [string] you parent pageComponent name 
 * @meta [string] will be in this.$route.meta
 * @show [boolean] 
 */
@Component
export class MyPage extends Vue{

}
```

## background gen process
- #### configs   

| name | description                      | required |   type   |   default   |
| ---- | :------------------------------- | :------: | :------: | :---------: |
| glob | glob config for vue router files |   true   | string[] | `undefined` |
| root | router root file                 |   true   |  string  | `undefined` |
| file | genereated router file           |   true   |  string  | `undefined` |

- ####  config for `@vue/cli` demo
```js
// file $projectRoot/vue.config.js
// if pluginOptions.vuexGen is not configed , background gen process will not start
module.exports = {
  pluginOptions: {
    routerGen: {
      glob: ["src/views/*.+(ts|tsx)", "src/views/**/*.+(ts|tsx)"],
      root: "src/views",
      file: "src/router.ts"
    }
  }
}
//or
module.exports = {
  pluginOptions: {
    routergen: {
      glob: ["src/views/*.+(ts|tsx)", "src/views/**/*.+(ts|tsx)"],
      root: "src/views",
      file: "src/router.ts"
    }
  }
}
```