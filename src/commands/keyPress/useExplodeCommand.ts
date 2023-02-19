import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Element, { ElementWithId } from '../../drawingElements/element'
import Line from '../../drawingElements/line'
import Polyline from '../../drawingElements/polyline'
import { useToolsStore } from '../../stores/tools/index'
import { copyLine } from '../../utils/line'
import { copyArc } from '../../utils/arc'

const useExplodeCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const selectedElements = useElementsStore((state) => state.selectedElements)
  const startReplacingElements = useElementsStore((state) => state.startReplacingElements)
  const continueReplacingElements = useElementsStore((state) => state.continueReplacingElements)
  const replaceElements = useElementsStore((state) => state.replaceElements)
  const clearSelection = useElementsStore((state) => state.clearSelection)

  const resetTool = useToolsStore((state) => state.resetTool)

  const handleExplodeCmd = useCallback(() => {
    if (!selectedElements) {
      resetTool()
      return
    }

    const replacements: Map<string, {
      replacingElements: ElementWithId[];
      removedSections: Element[];
    }> = new Map()
    for (const selectedElement of selectedElements.values()) {
      if (!(selectedElement instanceof Polyline)) {
        continue
      }

      const replacingElements = selectedElement.elements.map(subElement => {
        const copiedElement = subElement instanceof Line
          ? copyLine(subElement, false, true) as ElementWithId
          : copyArc(subElement, false, true) as ElementWithId

        copiedElement.groupId = null
        return copiedElement
      })
      replacements.set(selectedElement.id, {
        removedSections: [selectedElement],
        replacingElements
      })
    }

    if (replacements.size > 0) {
      startReplacingElements(replacements)
      continueReplacingElements()
      replaceElements()
      clearSelection()
    }

    resetTool()
  }, [selectedElements])

  return handleExplodeCmd
}

export default useExplodeCommand