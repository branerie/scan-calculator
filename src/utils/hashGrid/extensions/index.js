import SetUtils from '../../setUtils'
import getLineDivKeys from './line'
import getArcDivKeys from './arc'
import { getDimensionDivision1d } from '../utils'

function getElementDivKeys(element) {
    if (element.baseType === 'polyline') {
        let divKeys = new Set()
        for (const subElement of element.elements) {
            const subElementDivKeys = subElement.type === 'line'
                    ? getLineDivKeys.call(this, subElement)
                    : getArcDivKeys.call(this, subElement)
            divKeys = SetUtils.union(divKeys, subElementDivKeys)
        }

        return divKeys
    }
    
    if (element.baseType === 'line') {
        return getLineDivKeys.call(this, element)
    }

    if (element.baseType === 'arc') {
        return getArcDivKeys.call(this, element)
    }
}

function getDivIndicesFromCoordinates(x, y) {
    const xDiv = getDimensionDivision1d(x, this.startPosX, this.divSizeX)
    const yDiv = getDimensionDivision1d(y, this.startPosY, this.divSizeY)

    return [xDiv, yDiv]
}

export {
    getElementDivKeys,
    getDivIndicesFromCoordinates
}