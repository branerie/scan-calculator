const filterData = (data, dataFilters, shouldFulfillFilters = true) => {
    return data.filter(dataEntry => {
        for (const key of Object.keys(dataFilters)) {
            if (dataEntry[key] !== dataFilters[key]) {
                return shouldFulfillFilters ? false : true
            }
        }

        return shouldFulfillFilters ? true : false
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
        if (value <= this.nodeValue) {
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
        if (minValue <= this.nodeValue) {
            leftSideResults = this.left
                ? this.left.find(minValue, maxValue, dataFilters)
                : this.#leftData.filter(data => data.leafValue >= minValue && data.leafValue <= maxValue)
        }

        let rightSideResults = []
        if (maxValue >= this.nodeValue) {
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
        if (nodeValue <= this.nodeValue) {
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