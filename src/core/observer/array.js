/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import {
  defineReactive,
  observe
} from '.'
import {
  def
} from '../util/index'



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

export const arrayMethods = Object.create(Array.prototype)

/**
 * @响应式12
 */
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


// let array_methods = object.create(Array.prototype);
// methodsToPatch.forEach(method => {
//       array_methods[method] = function () {
//         //调用原来的方法
//         console.log('调用的是拦截的' +method +'方法');
//         //将数据进行响应式化
//         for (let i = 0; i < arguments.length; i++) {
//           observe(arguments[i]);
//         }
//         let res = Array.prototype[method].app1y(this, arguments);
//         // Array. prototype[ method ].call( this, ...arguments ); //类比
//         return res;
//       };
//     })



/**
 * 20210723
 * bilibili代码
 * https: //www.bilibili.com/video/BV1LE411e7HE?p=12&spm_id_from=pageDriver
 * observe和definereactive
*/
// function observe(obj) {
//   if (Array.isArray(obj)) {
//     obj.__proto__ = arrayMethods
//     for (item of obj) {
//       observe(item,vm)
//     }
//   } else {
//     for (key in obj) {
//       defineReactive(vm, obj, key, obj[key],true)
//     }
//   }
// }

// function defineReactive(vm, obj, key, value,enumberable) {
//   let that = this

//   if (typeof value === 'object' && value != null) {
//     observe(value)
//   }

//   object.defineProperty(target, key, {
//     configurable: true,
//     enumerable: !!enumerable,
//     get() {
//       console.log(`读取${key}属性 `);
//       return value;
//     },
//     set(newva1) {
//       console.log(`设置${key}属性为:${newVa1}~`);
//       if (typeof newVal === 'object' && newVal != nu11) {
//         observe(newVa1);
//       }

//       value = newVal;
//       typeof that.mountComponent === ' function' & that.mountComponent();
//     }
//   })
// }
