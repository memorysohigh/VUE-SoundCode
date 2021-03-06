/* @flow */

import VNode, { createTextVNode } from 'core/vdom/vnode'
import { isFalse, isTrue, isDef, isUndef, isPrimitive } from 'shared/util'

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
/**
 * simpleNormalizeChildren⽅ 法调⽤ 场景是 render 函数当函数是编译⽣ 成的。 理论上编译⽣ 成的
 children 都已经是 VNode 类型的， 但这⾥ 有⼀ 个例外， 就是 functional component 函数式组件
 返回的是⼀ 个数组⽽ 不是⼀ 个根节点， 所以会通过 Array.prototype.concat⽅ 法把整个
 children 数组打平， 让它的深度只有⼀ 层。

*/
export function simpleNormalizeChildren (children: any) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      // [].concat([], children)
      //   (3)[1, 2, Array(2)] 0: 11: 22: (2)[3, 4] length: 3[[Prototype]]: Array(0)
      // Array.prototype.concat.call([], children)
      //   (3)[1, 2, Array(2)]
      // Array.prototype.concat.bind([], children)()
      //   (3)[1, 2, Array(2)]
      // Array.prototype.concat.call([], ...children)
      //   (4)[1, 2, 3, 4]
      // let p = (a, b, c) => {
      //   console.log(a, b, c)
      // }
      //
      // p.call(Array, 1, 2, 3)
      //  2 1 2 3
      //
      // p.call(Array, [1, 2, 3])
      //  2(3)[1, 2, 3] undefined undefined
      //
      // p.apply(Array, [1, 2, 3])
      //  2 1 2 3
      //
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
/**
 * normalizeChildren⽅ 法的调⽤ 场景有 2 种，⼀ 个场景是 render 函数是⽤ 户⼿ 写的， 当
 *children 只有⼀ 个节点的时候， Vue.js 从接⼝ 层⾯ 允许⽤ 户把 children 写成基础类型⽤ 来创建单
 *个简单的⽂ 本节点， 这种情况会调⽤ createTextVNode 创建⼀ 个⽂ 本节点的 VNode； 另⼀ 个场景是
 *当编译 slot、 v -
 *  for 的时候会产⽣ 嵌套数组的情况， 会调⽤ normalizeArrayChildren⽅ 法，
*/
export function normalizeChildren (children: any): ?Array<VNode> {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

function isTextNode (node): boolean {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}
/**
 * children 表⽰ 要规范的⼦ 节点，
 * nestedIndex 表⽰嵌套的索引， 因为单个 child 可能是⼀ 个数组类型。 normalizeArrayChildren 主要的逻辑就是
 *遍历 children， 获得单个节点 c， 然后对 c 的类型判断， 如果是⼀ 个数组类型， 则递归调⽤
 *normalizeArrayChildren;
 *如果是基础类型， 则通过 createTextVNode⽅ 法转换成 VNode 类型；
 *否则就已经是 VNode 类型了， 如果 children 是⼀ 个列表并且列表还存在嵌套的情况， 则根据
 *nestedIndex 去更新它的 key。 这⾥ 需要注意⼀ 点， 在遍历的过程中， 对这 3 种情况都做了如下处
 *理： 如果存在两个连续的 text 节点， 会把它们合并成⼀ 个 text 节点。

*/
function normalizeArrayChildren (children: any, nestedIndex?: string): Array<VNode> {
  const res = []
  let i, c, lastIndex, last
  for (i = 0; i < children.length; i++) {
    c = children[i]
    if (isUndef(c) || typeof c === 'boolean') continue
    lastIndex = res.length - 1
    last = res[lastIndex]
    //  nested
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`)
        // merge adjacent text nodes
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]: any).text)
          c.shift()
        }
        res.push.apply(res, c)
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c)
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c))
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text)
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = `__vlist${nestedIndex}_${i}__`
        }
        res.push(c)
      }
    }
  }
  return res
}
