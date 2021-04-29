/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import {
  def
} from '../util/index'

export const arrayMethods = Object.create(Array.prototype)

// 数组方法名methodsName
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

// 遍历数组方法名methodsName
// 添加到重写的数组原型对象arrayMethods
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = Array.prototype[method]
    //设置重写数组原型上的7个方法
    def(arrayMethods, method, function mutator(...args) {
    // 调用数组原型上的的方法，改变指向到当前数组 this：当前数组 ...args：当前数组的参数
    const result = original.apply(this, args)
    const ob = this.__ob__
    // 用来存储push、unshift、splice三个方法添加进来的数组项，然后通过observe响应式化
    let inserted = []
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    return result
  })
})
