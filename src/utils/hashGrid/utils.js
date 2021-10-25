const getDimensionDivision1d = (dim, dimStart, divisionSize) => {
    return Math.floor((dim - dimStart) / divisionSize)
}

const getDivKey = (xDivIndex, yDivIndex) => `${xDivIndex},${yDivIndex}`

const parseDivKey= (divKey) => divKey.split(',').map(Number)

export {
    getDimensionDivision1d,
    getDivKey,
    parseDivKey,
}