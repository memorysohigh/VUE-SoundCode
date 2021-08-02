/* @flow */

import * as nodeOps from 'web/runtime/node-ops'
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

//  nodeOps 封装了⼀系列 DOM 操作的⽅法， modules 定义了⼀些模块的钩⼦函数的实现
export const patch: Function = createPatchFunction({ nodeOps, modules })
