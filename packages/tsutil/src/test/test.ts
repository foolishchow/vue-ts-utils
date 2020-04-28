import { Docs, ssss } from "./mmm";


export function name(params: string) {
  return params as any as ssss.inter
}

export class UserClasses {

  private userName: string = '';

  // constructor(userName: string);
  // constructor(userName: string, age: number);
  constructor(userName: any, age?: any) {
    this.userName = userName;
  }

  books() {
    return {
      name: "",
      lines: [],
      page: 10
    } as Docs
  }
  getUserName() {
    return this.userName;
  }
}