# vuex class wrapper for vue


<p>
    <a href="https://www.npmjs.com/package/@foolishchow/vuex">
        <img src="https://img.shields.io/npm/v/@foolishchow/vuex.svg" alt="Version">
    </a> 
    <a href="https://www.npmjs.com/package/@foolishchow/vuex">
        <img src="https://img.shields.io/npm/dm/@foolishchow/vuex.svg" alt="Downloads">
    </a>
</p>


## install

```shell
yarn add @foolishchow/vuex
yarn add @foolishchow/vue-cli-plugin-vuex-gen
```



## background gen process
- #### configs   

| name     | description                       | required |   type   |       default        |
| -------- | :-------------------------------- | :------: | :------: | :------------------: |
| glob     | glob config for vuex files        |   true   | string[] |     `undefined`      |
| file     | genereated vuex file              |   true   |  string  |     `undefined`      |
| store    | store name                        |  false   |  string  |       `Store`        |
| Module   | Decorate Name of `FVuex.Module`   |  false   | string[] |  `["FVuex.Module"]`  |
| Action   | Decorate Name of `FVuex.Action`   |  false   | string[] |  `["FVuex.Action"]`  |
| Mutation | Decorate Name of `FVuex.Mutation` |  false   | string[] | `["FVuex.Mutation"]` |

- ####  config for `@vue/cli` demo
```js
// file $projectRoot/vue.config.js
// if pluginOptions.vuexGen is not configed , background gen process will not start
module.exports = {
  pluginOptions: {
    vuexGen: {
      glob: ["src/store/**/*.ts"],
      file: "src/vuex.ts",
      store: "VuexStore"
    }
  }
}
//or
module.exports = {
  pluginOptions: {
    vuexgen: {
      glob: ["src/store/**/*.ts"],
      file: "src/vuex.ts",
      store: "VuexStore"
    }
  }
}
```

- ####  api for node
```js
import Api from "@foolishchow/vue-cli-plugin-vuex-gen";
let config = {
  glob: ["src/store/**/*.ts"],
  file: "src/vuex.ts",
  store: "FireWeedAdminVuexStore"
};
let cwd = process.cwd();
let alias = {
  '@': cwd + '/src',
  'vue$': 'vue/dist/vue.runtime.esm.js',
};
Api(config, alias)
```

## use

- if you code the module like this   
```typescript
import { FVuex } from "@foolishchow/vuex";

@FVuex.Module
export class UserModule {

  userInfo: { name: string } = { name: "" };

  get goodsClassCascder() {
    return "";
  }

  @FVuex.Mutation
  UpdateUserName(userName: string) {
    this.state.userInfo.name = userName;
  }


  @FVuex.Action
  InitUserInfo() {
    return Promise.resolve({} as { name: string })
  }
}
```   
the output main  `Store` file will gen    
```typescript

/**
 * this file is auto generated
 * don't modify by hand
 */
import Vue from "vue";
import Vuex from "vuex";
import { FVuex } from "@foolishchow/vuex";
import { UserModule as UserModule_1 } from "./store/user";
const StoreModules: any = {}
FVuex.addModule(StoreModules, "UserModule", UserModule_1)
Vue.use(Vuex)
export interface Store extends FVuex.Store<StoreNS.RootState, StoreNS.RootGetter, StoreNS.RootCommit, StoreNS.RootDispatch> {
}
export const Store: Store = new Vuex.Store(StoreModules);
export module StoreNS {
    export interface RootGetter {
        UserModule: StoreNS.UserModule.Getters;
    }
    export interface RootState {
        UserModule: StoreNS.UserModule.State;
    }
    export interface RootCommit {
        (type: "UserModule/UpdateUserName", userName: string, option?: FVuex.CommitOption): void;
        (payload: CommitPayload.UserModule_UpdateUserName, option?: FVuex.CommitOption): void;
    }
    export namespace CommitPayload {
        export type UserModule_UpdateUserName = {
            type: "UserModule/UpdateUserName";
            payload: string;
        };
    }
    export interface RootDispatch {
        (type: "UserModule/InitUserInfo", payload?: undefined, option?: FVuex.DispatchOption): Promise<{
            name: string;
        }>;
        (payload: DispatchPayload.UserModule_InitUserInfo, option?: FVuex.DispatchOption): Promise<{
            name: string;
        }>;
    }
    export namespace DispatchPayload {
        export type UserModule_InitUserInfo = {
            type: "UserModule/InitUserInfo";
        };
    }
}
export module StoreNS {
    export module UserModule {
        export interface State {
            userInfo: {
                name: string;
            };
        }
        export interface Getters {
            goodsClassCascder: string;
        }
        export interface Dispatch {
            (type: "InitUserInfo", payload?: undefined, option?: FVuex.ScopedDispatchOption): Promise<{
                name: string;
            }>;
            (payload: DispatchPayload.InitUserInfo, option?: FVuex.ScopedDispatchOption): Promise<{
                name: string;
            }>;
        }
        export namespace DispatchPayload {
            export type InitUserInfo = {
                type: "InitUserInfo";
            };
        }
        export interface Commit {
            (type: "UpdateUserName", userName: string, option?: FVuex.ScopedCommitOption): void;
            (payload: CommitPayload.UpdateUserName, option?: FVuex.ScopedCommitOption): void;
        }
        export namespace CommitPayload {
            export type UpdateUserName = {
                type: "UpdateUserName";
                payload: string;
            };
        }
    }
}
declare module "./store/user" {
    export interface UserModule {
        state: StoreNS.UserModule.State;
        rootState: StoreNS.RootState;
        getters: StoreNS.UserModule.Getters;
        rootGetters: StoreNS.RootGetter;
        commit: StoreNS.RootCommit & StoreNS.UserModule.Commit;
        dispatch: StoreNS.RootDispatch & StoreNS.UserModule.Dispatch;
        $store: Store;
    }
}
```
