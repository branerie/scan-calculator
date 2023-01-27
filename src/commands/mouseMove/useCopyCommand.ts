import { useCallback } from 'react'
import Point from '../../drawingElements/point'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'
import { MousePosition } from '../../utils/types/index'

const useCopyCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyCopiedElements = elementsStore(state => state.currentlyCopiedElements)
  const moveCopyingElements = elementsStore(state => state.moveCopyingElements)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const toolClicks = toolsStore(state => state.toolClicks)
  const addToolProp = toolsStore(state => state.addToolProp)

  const handleCopyCmd = useCallback((mousePosition: MousePosition) => {
    if (tool.name !== 'copy' || !currentlyCopiedElements) {
      return false
    }

    if (!toolClicks?.length) {
      return true
    }

    const basePoint = tool.props?.currentPos || toolClicks[0]
    
    const { mouseX, mouseY } = mousePosition
    const dX = mouseX - basePoint.x
    const dY = mouseY - basePoint.y

    moveCopyingElements(dX, dY)
    addToolProp({
      currentPos: new Point(
        Number(mouseX.toFixed(3)), 
        Number(mouseY.toFixed(3))
      )
    })

    return true
  }, [
    currentlyCopiedElements,
    tool.name, 
    tool.props?.currentPos, 
    toolClicks, 
    moveCopyingElements, 
    addToolProp
  ])

  return handleCopyCmd
}

export default useCopyCommand