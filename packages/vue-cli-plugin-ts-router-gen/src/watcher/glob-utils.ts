import globby = require("globby");
import GlobWatcher from "glob-watcher";
export const Glob = (globs: string[] | string) => {
  let gs = (typeof globs == "string") ? [globs] : globs;
  return globby(gs, {
    cwd: process.cwd()
  })
}

export const Watch = (globs: string[] | string) => {
  let gs = (typeof globs == "string") ? [globs] : globs;

  return GlobWatcher(gs, {
    cwd: process.cwd(),
    ignoreInitial: false,
    useFsEvents: false
  })
  // return new Promise((r, rj) => {
  //   let watcher = GlobWatcher(gs, {
  //     cwd: process.cwd(),
  //     ignoreInitial: false
  //   }, (error) => {
  //     if (error) {
  //       rj(error)
  //     } else {
  //       r(watcher);
  //     }
  //   })
  // })
}