// @flow
import { createMacro } from 'babel-plugin-macros'
import { addDefault } from '@babel/helper-module-imports'
import {
  getLabelFromPath,
  transformExpressionWithStyles,
  getTargetClassName
} from '@emotion/babel-utils'

export default createMacro(({ references, state, babel }) => {
  const t = babel.types
  if (references.default.length) {
    let styledIdentifier
    references.default.forEach(reference => {
      if (!styledIdentifier) {
        styledIdentifier = addDefault(reference, '@emotion/styled-base', {
          nameHint: 'styled'
        })
      }
      if (t.isMemberExpression(reference.parent)) {
        reference.parentPath.replaceWith(
          t.callExpression(t.cloneDeep(styledIdentifier), [
            t.stringLiteral(reference.parent.property.name)
          ])
        )
      } else {
        reference.replaceWith(t.cloneDeep(styledIdentifier))
      }
      if (reference.parentPath && reference.parentPath.parentPath) {
        const styledCallPath = reference.parentPath.parentPath
        let { node } = transformExpressionWithStyles({
          path: styledCallPath,
          state,
          babel,
          shouldLabel: false
        })
        if (node) {
          // we know the argument length will be 1 since that's the only time we will have a node since it will be static
          styledCallPath.node.arguments[0] = node
        }
      }
      if (t.isCallExpression(reference.parentPath)) {
        reference.parentPath.node.arguments[1] = t.objectExpression([
          t.objectProperty(
            t.identifier('target'),
            t.stringLiteral(getTargetClassName(state, t))
          ),
          t.objectProperty(
            t.identifier('label'),
            t.stringLiteral(getLabelFromPath(reference.parentPath, t))
          )
        ])
      }
    })
  }
})
