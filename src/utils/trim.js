import { pointsMatch } from './point'

const checkIfEdgeTrim = (trimPoint, startPoint, endPoint) => {
    const isTrimStart = pointsMatch(trimPoint, startPoint)
    const isTrimEnd = pointsMatch(trimPoint, endPoint)

    return isTrimStart || isTrimEnd
}

export {
    checkIfEdgeTrim
}