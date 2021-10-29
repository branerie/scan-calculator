import { MAX_NUM_ERROR } from '../../constants'
import { getDimensionDivision1d, getDivKey } from '../utils'

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

        const intersectionInitX = getDimensionDivision1d(
            currentIntersection.point.x,
            this.startPosX,
            this.divSizeX
        )
        const intersectionInitY = getDimensionDivision1d(
            currentIntersection.point.y,
            this.startPosY,
            this.divSizeY
        )
        containingDivs.add(getDivKey(intersectionInitX, intersectionInitY))

        // We have added first div of intersection. The function "getDimensionDivision1d" always returns the lower number
        // in case of an intersection and, therefore, we can always find the second div part of the intersection by adding
        // one to the X-div, Y-div or both (in case of a diagonal crossing)
        switch (currentIntersection.crossing) {
            case 'H':
                containingDivs.add(getDivKey(intersectionInitX, intersectionInitY - 1))
                break
            case 'V':
                containingDivs.add(getDivKey(intersectionInitX - 1, intersectionInitY))
                break
            case 'B':
                containingDivs.add(getDivKey(intersectionInitX - 1, intersectionInitY - 1))
                break
            default:
                throw new Error('Invalid value for "crossing" property of element : HashGrid intersection')
        }
    }

    return containingDivs
}

export { 
    getContainingDivsFromIntersectionsQueue 
}
