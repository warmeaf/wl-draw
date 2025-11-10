/**
 * Builtin plugins initialization and registration
 */

import { pluginRegistry } from '../registry'
import { arrowPlugin } from './arrow'
import { circlePlugin } from './circle'
import { imagePlugin } from './image'
import { linePlugin } from './line'
import { panPlugin } from './pan'
import { penPlugin } from './pen'
import { rectPlugin } from './rect'
import { selectPlugin } from './select'
import { textPlugin } from './text'

const builtinPlugins = [
  selectPlugin,
  panPlugin,
  rectPlugin,
  circlePlugin,
  linePlugin,
  arrowPlugin,
  penPlugin,
  textPlugin,
  imagePlugin,
]

builtinPlugins.forEach((plugin) => {
  pluginRegistry.register(plugin)
})

export { builtinPlugins }
