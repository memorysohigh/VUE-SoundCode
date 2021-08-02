/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  // 负责 Vue 的初始化过程
  Vue.prototype._init = function (options?: Object) {
       // vue 实例
    const vm: Component = this
    // 每个 vue 实例都有一个 _uid，并且是依次递增的
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options


    // ***在使用 Vue 开发项目的时候，我们是不会使用 _isComponent 选项
    // ***的，这个选项是 Vue 内部使用的，按照本节开头的例子，这里会走
    // ***else 分支，也就是这段代码：
    if (options && options._isComponent) {
      initInternalComponent(vm, options)
    } else {
      // mergeOptions的功能是把 Vue 构造函数的 options 和⽤ 户传⼊ 的 options 做⼀ 层合并， 到 vm.$options 上。
      vm.$options = mergeOptions(
        // ***第一个参数就是 Vue.constructor.options（resolveConstructorOptions返回的是Vue.constructor.options）
        // ***第二个参数是我们调用Vue构造函数时的参数选项
        // ***第三个参数是 vm 也就是 this 对象
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm) //***初始化组件实例关系属性，属性：parent、root、children、refs、_watcher、_inactive、_directInactive、_isMounted

    /**
     * 初始化自定义事件，这里需要注意一点，所以我们在 <comp @click="handleClick" /> 上注册的事件，监听者不是父组件，
     * 而是子组件本身，也就是说事件的派发和监听者都是子组件本身，和父组件无关
     *///***this.$emit/once/on/off都在这里
    initEvents(vm)
    initRender(vm) // ****解析组件的插槽信息，得到 vm.$slot，处理渲染函数，得到 vm.$createElement 方法，即 h 函数
    callHook(vm, 'beforeCreate') // 调用 beforeCreate 钩子函数
    initInjections(vm) // // 初始化组件的 inject 配置项，得到 result[key] = val 形式的配置对象，然后对结果数据进行响应式处理，并代理每个 key 到 vm 实例
    /**
     * @响应式2
     * 从这里开始进入， 数据响应式的重点
     */
    initState(vm) // 数据响应式的重点，处理 props、methods、data、computed、watch
    initProvide(vm) // 解析组件配置项上的 provide 对象，将其挂载到 vm._provided 属性上
    callHook(vm, 'created') // 调用 created 钩子函数

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    // 如果发现配置项上有 el 选项，则自动调用 $mount 方法，也就是说有了 el 选项，就不需要再手动调用 $mount，反之，没有 el 则必须手动调用 $mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

/**
 * 从组件构造函数中解析配置对象 options，并合并基类选项
 * @param {*} Ctor
 * @returns
 */
export function resolveConstructorOptions (Ctor: Class<Component>) {
  // 配置项目
  let options = Ctor.options
  // ***vue构造函数上没找到options
  // ***console.log(999999999, Object.hasOwnProperty(Ctor.prototype,Ctor));
  if (Ctor.super) {
    // 存在基类，递归解析基类构造函数的选项
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // 说明基类构造函数选项已经发生改变，需要重新设置
      Ctor.superOptions = superOptions
      // 检查 Ctor.options 上是否有任何后期修改/附加的选项（＃4976）
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // 如果存在被修改或增加的选项，则合并两个选项
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 选项合并，将合并结果赋值为 Ctor.options
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

/**
 * 解析构造函数选项中后续被修改或者增加的选项
 */
function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  // 构造函数选项
  const latest = Ctor.options
  // 密封的构造函数选项，备份
  const sealed = Ctor.sealedOptions
  // 对比两个选项，记录不一致的选项
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
