import { getQuadrantFromAngle } from '../../angle'

const sortDivs = (divs, crossingVertical, ascending) => {
    const axisIndex = crossingVertical ? 0 : 1

    if (ascending) {
        return divs.sort((a, b) => a[axisIndex] - b[axisIndex])
    }

    return divs.sort((a, b) => b[axisIndex] - a[axisIndex])
}

const sortDivsByArcIntersectionOrder = (intersectionDivsTuple, intersectionAngleFromArcCenter, crossing) => {
    const intersectionQuadrant = getQuadrantFromAngle(intersectionAngleFromArcCenter)

    if (intersectionQuadrant === 0) {
        switch (intersectionAngleFromArcCenter) {
            case 0:
            case 360:
                // first div is the one with smaller x-index
                return sortDivs(intersectionDivsTuple, true, true)
            case 90:
                // first div is the one with smaller y-index
                return sortDivs(intersectionDivsTuple, false, true)
            case 180:
                // first div is the one with larger x-index
                return sortDivs(intersectionDivsTuple, true, false)
            case 270:
                // first div is the one with larger y-index
                return sortDivs(intersectionDivsTuple, false, false)
            default:
                throw new Error(
                    `Invalid intersection (quadrant, angle) pair - (${intersectionQuadrant},${intersectionAngleFromArcCenter})`
                )
        }
    }

    if (crossing === 'B') {
        if (intersectionQuadrant < 3) {
            return sortDivs(intersectionDivsTuple, false, true)
        }

        return sortDivs(intersectionDivsTuple, false, false)
    }

    const crossingVertical = crossing === 'V'
    let shouldSortAscending
    if (crossingVertical) {
        shouldSortAscending = intersectionQuadrant === 1 || intersectionQuadrant === 4
    } else {
        shouldSortAscending = intersectionQuadrant < 3
    }

    return sortDivs(intersectionDivsTuple, crossingVertical, shouldSortAscending)
}

export { sortDivsByArcIntersectionOrder }
