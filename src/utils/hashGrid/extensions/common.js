import { MAX_NUM_ERROR } from '../../constants'
import { getDimensionDivision1d, getDivKey } from '../utils'

function getContainingDivsFromIntersectionPoint(point, crossingAxis) {
    // returns an array with two values, containing the hash grid divisions
    // between which the intersection point lies
    
    const intersectionInitX = getDimensionDivision1d(
        point.x,
        this.startPosX,
        this.divSizeX
    )
    const intersectionInitY = getDimensionDivision1d(
        point.y,
        this.startPosY,
        this.divSizeY
    )

    const firstDivision = getDivKey(intersectionInitX, intersectionInitY)

    // We have added first div of intersection. The function "getDimensionDivision1d" always returns the lower number
    // in case of an intersection and, therefore, we can always find the second div part of the intersection by adding
    // one to the X-div, Y-div or both (in case of a diagonal crossing)
    let secondDivision = null
    switch (crossingAxis) {
        case 'H':
            secondDivision = getDivKey(intersectionInitX, intersectionInitY - 1)
            break
        case 'V':
            secondDivision = getDivKey(intersectionInitX - 1, intersectionInitY)
            break
        case 'B':
            secondDivision = getDivKey(intersectionInitX - 1, intersectionInitY - 1)
            break
        default:
            throw new Error('Invalid value for "crossing" property of element : HashGrid intersection')
    }

    return [
        firstDivision,
        secondDivision
    ]
}

function getContainingDivsFromIntersectionsQueue(intersectionsQueue) {
    const containingDivs = new Set()
    while (intersectionsQueue.size > 0) {
        const currentIntersection = intersectionsQueue.pop()
        const nextIntersection = intersectionsQueue.peek()

        if (
            !!nextIntersection &&
            Math.abs(currentIntersection.distanceFromStart - nextIntersection.distanceFromStart) <
                MAX_NUM_ERROR
        ) {
            if (currentIntersection.crossing !== nextIntersection.crossing) {
                // line is crossing through an intersection in the HashGrid (therefore is passing through
                // grids diagonally and we can join these two intersections)
                nextIntersection.crossing = 'B'
                continue
            }

            throw new Error('An error occurred while calculating HashGrid divs of line')
        }

        const intersectionDivs = getContainingDivsFromIntersectionPoint.call(
            this,
            currentIntersection.point,
            currentIntersection.crossing
        )

        containingDivs.add(intersectionDivs[0])
        containingDivs.add(intersectionDivs[1])
    }

    return containingDivs
}

export { 
    getContainingDivsFromIntersectionPoint,
    getContainingDivsFromIntersectionsQueue,
}
