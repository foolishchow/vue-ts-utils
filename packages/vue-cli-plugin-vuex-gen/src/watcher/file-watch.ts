import { EventEmitter } from "events";
import { Watch } from "./glob-utils";
import * as fs from "fs";

export interface FileWatcher extends EventEmitter {
  on(event: "change", listener: (file: string) => void): this;
  on(event: "add", listener: (file: string) => void): this;
  on(event: "unlink", listener: (file: string) => void): this;
  once(event: "change", listener: (file: string) => void): this;
  once(event: "add", listener: (file: string) => void): this;
  once(event: "unlink", listener: (file: string) => void): this;
}
export class FileWatcher extends EventEmitter {
  glob: fs.FSWatcher;

  constructor(globs: string[]) {
    super();
    this.glob = Watch(globs);
    this.glob.on("change", (path, stat) => {
      this.emit("change", path, stat)
    });
    this.glob.on("add", (path, stat) => {
      this.emit("add", path, stat)
      // console.info("add", path)
    });
    this.glob.on("unlink", (path, stat) => {
      this.emit("unlink", path, stat)
    });
  }

}