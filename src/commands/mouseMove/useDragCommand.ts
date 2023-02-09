import { MouseEvent, useCallback } from 'react'
import { useToolsStore } from '../../stores/tools/index'

const useDragCommand = () => {
  const mouseDrag = useToolsStore(state => state.mouseDrag)
  const panView = useToolsStore(state => state.panView)
  
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