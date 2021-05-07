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
    const { tool, addToolClick, resetTool } = useToolsContext()

    const handleTransformCmd = useCallback((event, clickedPoint) => {
        if (!selectedElements) return

        if (tool.name === 'move') {
            if (!currentlyEditedElements) {
                startEditingElements(selectedElements)
                addToolClick(clickedPoint)
                return
            }

            editElements()
            resetTool()
            return
        }

        if (tool.name === 'rotate') {
            if (!currentlyEditedElements && !tool.clicks) {
                // this was the first click of the rotate operation, setting up the pivot center
                addToolClick(clickedPoint)
                return
            }

            if (!currentlyEditedElements && tool.clicks && tool.clicks.length === 1) {
                // second click of the rotate operation, setting up the beggining of the angle of rotation
                startEditingElements(selectedElements)
                addToolClick(clickedPoint)
                return
            }

            editElements()
            resetTool()
            return
        }

        if (tool.name === 'mirror') {
            if (!currentlyEditedElements) {
                startEditingElements(selectedElements)
                addToolClick(clickedPoint)
                return
            }

            const mirrorFirstPoint = tool.clicks[0]
            const mirrorLine = createLine(
                mirrorFirstPoint.x,
                mirrorFirstPoint.y,
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
            resetTool()
            return
        }

        if (tool.name === 'scale') {
            if (!currentlyEditedElements) {
                startEditingElements(selectedElements)
                addToolClick(clickedPoint)
                return
            }

            editElements()
            resetTool()
            return
        }
    }, [
        selectedElements,
        tool.name, 
        tool.clicks, 
        currentlyEditedElements, 
        editElements, 
        resetTool, 
        startEditingElements, 
        addToolClick, 
        changeEditingElements
    ])

    return handleTransformCmd
}

export default useTransformCommand