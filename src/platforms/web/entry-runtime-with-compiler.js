/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

/**
  * 这段代码⾸先缓存了原型上的 $mount ⽅法，再重新定义该⽅法，我们先来分析这段代码。⾸先，它
  *对 el 做了限制，Vue 不能挂载在 body 、 html 这样的根节点上。接下来的是很关键的逻辑 ——
  *如果没有定义 render ⽅法，则会把 el 或者 template 字符串转换成 render ⽅法。这⾥我们
  *要牢记，在 Vue 2.0 版本中，所有 Vue 的组件的渲染最终都需要 render ⽅法，⽆论我们是⽤单⽂件
  *.vue ⽅式开发组件，还是写了 el 或者 template 属性，最终都会转换成 render ⽅法，那么这个
  *过程是 Vue 的⼀个“在线编译”的过程，它是调⽤ compileToFunctions ⽅法实现的，编译过程我们之
  *后会介绍。最后，调⽤原先原型上的 $mount ⽅法挂载。
  *原先原型上的 $mount ⽅法在 src/platform/web/runtime/index.js 中定义，之所以这么设计完
  *全是为了复⽤，因为它是可以被 runtime only 版本的 Vue 直接使⽤的。
 */

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this) //警告('无效模板选项:')
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
