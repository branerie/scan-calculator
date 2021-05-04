import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createLine } from '../../utils/elementFactory'
import { getPerpendicularPointToLine } from '../../utils/line'

const useTransformCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            startEditingElements,
            changeEditingElements,
        },
        history: {
            editElements,
        },
        selection: {
            selectedElements,
        }
    } = useElementsContext()
    const { tool, setTool } = useToolsContext()

    const handleTransformCmd = useCallback((event, clickedPoint) => {
        if (!selectedElements) return

        if (tool.name === 'move') {
            if (!currentlyEditedElements) {
                startEditingElements(selectedElements)
                setTool({ ...tool, initialClick: clickedPoint })
                return
            }

            editElements()
            setTool({ type: 'select', name: 'select' })
            return
        }

        if (tool.name === 'rotate') {
            if (!currentlyEditedElements && !tool.pivotPoint) {
                // this was the first click of the rotate operation, setting up the pivot center
                setTool({ ...tool, pivotPoint: clickedPoint })
                return
            }

            if (!currentlyEditedElements && tool.pivotPoint) {
                // second click of the rotate operation, setting up the beggining of the angle of rotation
                startEditingElements(selectedElements)
                setTool({ ...tool, angleStartPoint: clickedPoint })
                return
            }

            editElements()
            setTool({ type: 'select', name: 'select' })
            return
        }

        if (tool.name === 'mirror') {
            if (!currentlyEditedElements) {
                startEditingElements(selectedElements)
                setTool({ ...tool, mirrorFirstPoint: clickedPoint })
                return
            }

            const mirrorLine = createLine(
                tool.mirrorFirstPoint.x,
                tool.mirrorFirstPoint.y,
                null,
                clickedPoint.x,
                clickedPoint.y
            )

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            for (const editedElement of newCurrentlyEditedElements) {
                const selectionPoints = editedElement.getSelectionPoints()
                for (const selectionPoint of selectionPoints) {
                    const perpPoint = getPerpendicularPointToLine(selectionPoint, mirrorLine)
                    const newPointX = selectionPoint.x + (perpPoint.x - selectionPoint.x) * 2
                    const newPointY = selectionPoint.y + (perpPoint.y - selectionPoint.y) * 2

                    editedElement.setPointById(selectionPoint.pointId, newPointX, newPointY)
                }

                if (editedElement.baseType === 'arc') {
                    const startPoint = editedElement.startPoint
                    const endPoint = editedElement.endPoint

                    editedElement.setPointById(startPoint.pointId, endPoint.x, endPoint.y)
                    editedElement.setPointById(endPoint.pointId, startPoint.x, startPoint.y)
                }
            }

            changeEditingElements(newCurrentlyEditedElements)
            editElements()
            setTool({ type: 'select', name: 'select' })
            return
        }
    }, [
        changeEditingElements, 
        currentlyEditedElements, 
        editElements, 
        selectedElements, 
        setTool, 
        startEditingElements,
        tool
    ])

    return handleTransformCmd
}

export default useTransformCommand