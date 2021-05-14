const getOrthoCoordinates = (referenceX, referenceY, currentX, currentY) => {
    const xDiff = Math.abs(referenceX - currentX)
    const yDiff = Math.abs(referenceY - currentY)

    let finalX = currentX
    let finalY = currentY
    if (xDiff < yDiff) {
        finalX = referenceX
    } else {
        finalY = referenceY
    }

    return [finalX, finalY]
}

export {
    getOrthoCoordinates
}