import Node, { TreeData } from './node'

const NUM_LAYERS = 5

const splitNode = <TData extends TreeData>(
  node: Node<TData>, 
  layer: number
) => {
  if (layer === NUM_LAYERS) return

  const halvedNodeValue = node.nodeValue / 2
  node.left = new Node(halvedNodeValue)
  node.right = new Node(node.nodeValue + halvedNodeValue)

  splitNode(node.left, layer + 1)
  splitNode(node.right, layer + 1)
}

const createTree = <TData extends TreeData>(initialSize: number) => {
  const rootValue = initialSize / 2
  const root = new Node<TData>(rootValue)

  let currentLayer = 1
  splitNode<TData>(root, currentLayer)

  return root
}

export { createTree }
