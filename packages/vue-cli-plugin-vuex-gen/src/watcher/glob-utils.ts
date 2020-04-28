import GlobWatcher from "glob-watcher";
import globby = require("globby");

export const Watch = (globs: string[] | string) => {
  let gs = (typeof globs == "string") ? [globs] : globs;

  return GlobWatcher(gs, {
    cwd: process.cwd(),
    ignoreInitial: false
  })
}

export const Glob = (globs: string[] | string) => {
  let gs = (typeof globs == "string") ? [globs] : globs;
  return globby(gs, {
    cwd: process.cwd()
  })
}