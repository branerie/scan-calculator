import Node from './node'

const NUM_LAYERS = 5

const splitNode = (node, layer) => {
    if (layer === NUM_LAYERS) return

    const halvedNodeValue = node.nodeValue / 2
    node.left = new Node(halvedNodeValue)
    node.right = new Node(node.nodeValue + halvedNodeValue)

    splitNode(node.left, layer + 1)
    splitNode(node.right, layer + 1)
}

const createTree = (initialSize) => {
    const rootValue = initialSize / 2
    const root = new Node(rootValue)

    let currentLayer = 1
    splitNode(root, currentLayer)

    return root
}

export {
    createTree
}