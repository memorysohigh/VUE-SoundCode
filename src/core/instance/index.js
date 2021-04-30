import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
import Watcher from '../observer/watcher'

/**
 * @响应式1
 * vue构造函数通过initMixin的initState函数进行初始化
 */

// ****Vue构造函数
// new Vue时传进来的data、钩子函数、methods、watch、computed。。。。
function Vue (options) {
// 安全提示  告诉开发者必须使用 new 操作符调用 Vue。
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  //****调用 Vue.prototype._init 方法，该方法是在 initMixin 中定义的
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
