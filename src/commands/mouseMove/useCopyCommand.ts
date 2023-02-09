import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Point from '../../drawingElements/point'
import { useToolsStore } from '../../stores/tools/index'
import { MousePosition } from '../../utils/types/index'

const useCopyCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyCopiedElements = useElementsStore((state) => state.currentlyCopiedElements)
  const moveCopyingElements = useElementsStore((state) => state.moveCopyingElements)

  const tool = useToolsStore((state) => state.tool)
  const toolClicks = useToolsStore((state) => state.toolClicks)
  const addToolProp = useToolsStore((state) => state.addToolProp)

  const handleCopyCmd = useCallback(
    (mousePosition: MousePosition) => {
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
        currentPos: new Point(Number(mouseX.toFixed(3)), Number(mouseY.toFixed(3))),
      })

      return true
    },
    [currentlyCopiedElements, tool.name, tool.props?.currentPos, toolClicks, moveCopyingElements, addToolProp]
  )

  return handleCopyCmd
}

export default useCopyCommand
