import SetUtils from '../../setUtils'
import getLineDivKeys from './line'
import getArcDivKeys from './arc'
import { getDimensionDivision1d } from '../utils'
import HashGrid from '../index'
import Element from '../../../drawingElements/element'
import Polyline from '../../../drawingElements/polyline'
import Line from '../../../drawingElements/line'
import Arc from '../../../drawingElements/arc'
import { Ensure } from '../../types/generics'

function getElementDivKeys(this: HashGrid, element: Element) {
  if (element instanceof Polyline) {
    let divKeys = new Set<string>()
    for (const subElement of element.elements) {
      const subElementDivKeys = subElement instanceof Line
              ? getLineDivKeys.call(this, subElement)
              : getArcDivKeys.call(this, subElement as Ensure<Arc, 'startPoint' | 'endPoint'>)
      divKeys = SetUtils.union(divKeys, subElementDivKeys)
    }

    return divKeys
  }
  
  if (element instanceof Line) {
    return getLineDivKeys.call(this, element)
  }

  // if (element.baseType === 'arc') {
    return getArcDivKeys.call(this, element as Ensure<Arc, 'startPoint' | 'endPoint'>)
  // }
}

function getDivIndicesFromCoordinates(this: HashGrid, x: number, y: number) {
  const xDiv = getDimensionDivision1d(x, this.startPosX, this.divSizeX)
  const yDiv = getDimensionDivision1d(y, this.startPosY, this.divSizeY)

  return [xDiv, yDiv]
}

export {
  getElementDivKeys,
  getDivIndicesFromCoordinates
}