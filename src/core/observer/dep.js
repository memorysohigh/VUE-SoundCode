/* @flow */

import type Watcher from './Watcher'
import {
  remove
} from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ? Watcher;
  static id: number;
  static subs: Array<Watcher> ;

  constructor() {
    this.id = uid++
    this.subs = [] //Watcher数组，存放的都是Watcher实例
  }
  // 添加订阅
  addSub(sub: Watcher) {
    this.subs.push(sub)
  }
  // 移除依赖（Watcher） 删除subs中的sub
  removeSub(sub: Watcher) {
    remove(this.subs, sub)
  }
  // 添加依赖（Watcher） 调用的是this.addSub
  depend() {
    // 如果处于依赖的收集阶段
    // Dep.target就是一个我们自己指定的全局位置，用Windows.target也行，只要是全局唯一，没有歧义就行
    if (Dep.target) {
      Dep.target.addDep(this) //函数的最后就是addSub(this)，这里的this就是Dep.target就是Watcher
      // this.addSub(Dep.target)  bilibili 上是这么写的，
    }
  }

  notify() {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target Watcher being evaluated.
// This is globally unique because only one Watcher
// can be evaluated at a time.
//全局暂时存放Watcher的地方，一次只放一个
Dep.target = null
const targetStack = []

export function pushTarget(target: ? Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
