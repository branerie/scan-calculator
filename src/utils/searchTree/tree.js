class BinaryTree {
    constructor() {
        this.root = null
    }

    insert(value) {
        this.root.insert(value)
    }

    findLeaves(minValue, maxValue, dataId) {
        return this.root.find(minValue, maxValue, dataId)
    }

    remove(nodeValue, dataId) {
        return this.root.remove(nodeValue, dataId)
    }

    replace(nodeValue, dataFilters, newNodeValue, newData) {
        return this.root.replace(nodeValue, dataFilters, newNodeValue, newData)
    }
}

export default BinaryTree