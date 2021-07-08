import { MAX_NUM_ERROR } from "../constants"

const filterData = (data, dataFilters, shouldFulfillFilters = true) => {
    return data.filter(dataEntry => {
        for (const key of Object.keys(dataFilters)) {
            const isNumber = !isNaN(dataFilters[key])

            if (
                (isNumber && Math.abs(dataFilters[key] - dataEntry[key]) > MAX_NUM_ERROR) ||
                (!isNumber && dataEntry[key] !== dataFilters[key])
            ) {
                return !shouldFulfillFilters
            }
        }

        return shouldFulfillFilters
    })
}

class Node {
    #leftData
    #rightData

    constructor(nodeValue) {
        this.nodeValue = nodeValue
        this.left = null
        this.right = null
        this.#leftData = []
        this.#rightData = []
    }

    insert(value, data) {
        if (value < this.nodeValue || Math.abs(value - this.nodeValue) < MAX_NUM_ERROR) {
            if (this.left) {
                return this.left.insert(value, data)
            }

            this.#leftData.push(data)
            return
        }

        if (this.right) {
            return this.right.insert(value, data)
        }

        this.#rightData.push(data)
    }

    find(minValue, maxValue, dataFilters) {
        let leftSideResults = []
        if (minValue < this.nodeValue || Math.abs(minValue - this.nodeValue) < MAX_NUM_ERROR) {
            leftSideResults = this.left
                ? this.left.find(minValue, maxValue, dataFilters)
                : this.#leftData.filter(data => data.leafValue >= minValue && data.leafValue <= maxValue)
        }

        let rightSideResults = []
        if (maxValue > this.nodeValue || Math.abs(maxValue - this.nodeValue) < MAX_NUM_ERROR) {
            rightSideResults = this.right
                ? this.right.find(minValue, maxValue)
                : this.#rightData.filter(data => data.leafValue >= minValue && data.leafValue <= maxValue)
        }

        const results = leftSideResults.concat(rightSideResults)
        if (dataFilters) {
            return filterData(results, dataFilters, true)
        }

        return results
    }

    remove(nodeValue, dataFilters) {
        if (nodeValue < this.nodeValue || Math.abs(nodeValue - this.nodeValue) < MAX_NUM_ERROR) {
            if (this.left) {
                return this.left.remove(nodeValue, dataFilters)
            }

            const dataCountBeforeRemove = this.#leftData.length
            this.#leftData = filterData(this.#leftData, dataFilters, false)

            return this.#leftData.length < dataCountBeforeRemove
        }

        if (this.right) {
            return this.right.remove(nodeValue, dataFilters)
        }

        const dataCountBeforeRemove = this.#rightData.length
        this.#rightData = filterData(this.#rightData, dataFilters, false)

        return this.#rightData.length < dataCountBeforeRemove
    }

    replace(nodeValue, dataFilters, newNodeValue, newData) {
        this.remove(nodeValue, dataFilters)
        this.insert(newNodeValue, newData)
    }
}

export default Node