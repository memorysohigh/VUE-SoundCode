/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import {
  arrayMethods
} from './array' //重写的数组原型对象实例Object.create(Array.prototype)
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'



export let shouldObserve: boolean = true

export function toggleObserving(value: boolean) {
  shouldObserve = value
}

/**
 * @响应式7
 */
/*****观察者*****
 * 观察者类， 它附加到每个被观察的对象上
 * 对象。 一旦连接， 观察者转换目标
 *对象的属性键到getter / setter
 *收集依赖项和调度更新。
 */
export class Observer { //observer 的作用是：将数据对象data的属性转换为访问器属性
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor(value: any) {
    this.value = value
    // data的每个对象都实例化一个Dep
    this.dep = new Dep()
    this.vmCount = 0
    /**
     * @响应式8
     */
    // 在 value 对象上设置 __ob__ 属性，值为Observer实例，并且是不可遍历的enumerable=false
    def(value, '__ob__', this)
    /**
     * @响应式9
     */
    if (Array.isArray(value)) {
      /**
       * value 为数组
       * hasProto = '__proto__' in {}
       * 用于判断对象是否存在 __proto__ 属性，通过 obj.__proto__ 可以访问对象的原型链
       * 但由于 __proto__ 不是标准属性，所以有些浏览器不支持，比如 IE6-10，Opera10.1
       * 为什么要判断，是因为一会儿要通过 __proto__ 操作数据的原型链
       * 覆盖数组默认的七个原型方法，以实现数组响应式
       */
      if (hasProto) { //****hasProto = '__proto__' in {}
        // 有 __proto__
        // 改变obj的原型为我们重写的arrayMethods（重写的7个数组方法push,pop,shift,unshift,sort,reverse）
        protoAugment(value, arrayMethods) //value.__proto__ = arrayMethods
      } else {
        // 遍历数组原型的7个方法名字
        // 把七个重写好的数组方法设置到每个数组上
        copyAugment(value, arrayMethods, Object.getOwnPropertyNames(arrayMethods))
      }
      this.observeArray(value)
    } else {
      /**
       * @响应式14
       * 开始对象的响应式
       * value 为对象，为对象的每个属性（包括嵌套对象）设置响应式
       */
      this.walk(value)
    }
  }

  /**
   * @响应式15
   * 遍历对象上的每个 key，为每个 key 设置响应式
   * 仅当值为对象时才会走这里
   */
  walk(obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      //defineReactive第一次开始调用
      defineReactive(obj, keys[i])
    }
  }

  /**
   * @响应式13
   * 遍历数组，为数组的每一项设置观察，处理数组元素为对象的情况
   */
  observeArray(items: Array < any > ) {
    for (let i = 0; i < items.length; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
/**
 * @响应式10
 */
function protoAugment(target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * @响应式11
 */
function copyAugment(target: Object, src: Object, keys: Array < string > ) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i] //方法名
    // 把七个重写好的数组方法设置到每个数组上
    def(target, key, src[key]) //src[key]:重写后的方法
  }
}

/**
 * @响应式5
 * 为对象创建观察者实例，如果对象已经被观察过，则返回已有的观察者实例，否则创建新的观察者实例
 */
export function observe(value: any, asRootData: ? boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    // value 不是对象，或者value是元素节点直接return
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    /**
     * @响应式6
     * 如果 value 对象上存在 __ob__ 属性，则表示已经做过观察了，直接返回 __ob__ 属性
     */
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 没有__ob__创建观察者实例
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * @响应式16
 * 拦截 obj[key] 的读取和设置操作：
 *   1、在第一次读取时收集依赖，比如执行 render 函数生成虚拟 DOM 时会有读取操作
 *   2、在更新时设置新值并通知依赖更新
 */
var count = 0
export function defineReactive(
  obj: Object,
  key: string,
  // *************************************************************************************************************
  // *************************************************************************************************************
  // *******val的三个作用， 1、外部传进来的2、 判断是否与旧值一样触发set3、 获取值的时候触发get， 把val return出去*******
  // *************************************************************************************************************
  // *************************************************************************************************************
  val: any, //传进来的值，在set里面判断，与旧值一样你直接return，不一样就修改，然后get里面获取的时候，就得到了这个val。
  customSetter ? : ? Function,
  shallow ? : boolean
) {
  // 实例化 Dep，每一个 对象 都实例化一个 Dep
  const dep = new Dep()
  // 获取 obj[key] 的属性描述符，发现它 configurable=false 的话直接 return
  const property = Object.getOwnPropertyDescriptor(obj, key) //属性配置对象 描述符对象
  if (property && property.configurable === false) {
    return
  }

  // 记录 getter 和 setter，获取 val 值
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 递归调用，处理 val 即 obj[key] 的值为对象的情况，保证对象中的所有 key 都被观察
  // obj的子对象属性递归回去调observe
  // 如果子属性不是对象，observe函数里会判定，然后直接return
  // 提前把__ob__返回回来添加Watcher
  let childOb = !shallow && observe(val)

  /**
   * @响应式17
   */
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val
      // 判断是不是watcher触发的getter，是的话Dep.target里面肯定有Watcher，
      // 于是把Watcher添加到Dep中去
      // 不是的话直接返回值
      if (Dep.target) {
        // 依赖收集，在 dep 中添加 watcher，也在 watcher 中添加 dep
        dep.depend()
        // childOb 表示对象中嵌套对象的观察者对象，如果存在也对其进行依赖收集
        if (childOb) {
          // 这就是 this.key.chidlKey 被更新时能触发响应式更新的原因
          childOb.dep.depend()
          // 如果是 obj[key] 是 数组，则触发数组响应式
          if (Array.isArray(value)) {
            // 为数组项为对象的项添加依赖
            dependArray(value)
          }
        }
      }
      return value
    },
    // set 拦截对 obj[key] 的设置操作
    set: function reactiveSetter(newVal) {
      // 旧的 obj[key]
      const value = getter ? getter.call(obj) : val
      // 如果新老值一样，则直接 return，不跟新更不触发响应式更新过程
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // setter 不存在说明该属性是一个只读属性，直接 return
      if (getter && !setter) return
      // 设置新值
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }

      // 对新值进行观察，让新值也是响应式的
      //newValue回去调observe
      // 如果不是对象的话，observe函数里会判定，然后直接return，是的话，从observe再来到这
      /*
       *递归顺序：
       */ // observe（）  ==>  看obj有无__ob__  =无=> new Observer（） ==> defineReactive（）
      //^^
      //||
      //****************************************** // 在obj上设置不可遍历的__ob__******************************************
      //**********************//Observer的作用》》》// 遍历obj上的所有属性，调用******************************************
      //****************************************** // defineReactive设置响应式******************************************
      childOb = !shallow && observe(newVal)
      // 依赖通知更新
      dep.notify() //到Dep调用notify ==>watcher的update() ==> watcher的run()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set(target: Array < any > | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del(target: Array < any > | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * 遍历每个数组元素，递归处理数组项为对象的情况，为其添加依赖
 * 因为前面的递归阶段无法为数组中的对象元素添加依赖
 */
function dependArray(value: Array < any > ) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}

