const getQuadrant = (deltaX, deltaY) => {
    if (deltaX === 0 || deltaY === 0) {
        return 0
    }

    if (deltaX > 0) {
        if (deltaY > 0) {
            return 1
        }

        return 4
    } 

    // deltaX is negative
    if (deltaY > 0) {
        return 2
    }

    return 3
}

const radiansToDegrees = (radians) => {
    return (radians * 180) / Math.PI
}

const degreesToRadians = (degrees) => {
    return (degrees / 180) * Math.PI
}

export {
    getQuadrant,
    radiansToDegrees,
    degreesToRadians
}