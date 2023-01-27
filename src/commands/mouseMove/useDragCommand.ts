import { MouseEvent, useCallback } from 'react'
import { useToolsStore } from '../../stores/tools/index'

const useDragCommand = () => {
  const toolsStore = useToolsStore()
  const mouseDrag = toolsStore(state => state.mouseDrag)
  const panView = toolsStore(state => state.panView)
  
  const handleDragCmd = useCallback((event: MouseEvent) => {
    if (!mouseDrag || event.buttons !== 4) {
      return false
    }

    const { clientX, clientY } = event
    panView(mouseDrag[0], mouseDrag[1], clientX, clientY)
    return true
  }, [mouseDrag, panView])

  return handleDragCmd
}

export default useDragCommand