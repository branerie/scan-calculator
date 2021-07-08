import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import useTrimUtils from '../../hooks/utility/useTrimUtils'

const useTrimCommand = () => {
    const {
        elements: {
            getElementsContainingPoint,
            getElementsInContainer,
            startReplacingElements,
            clearReplacingElements,
            isReplacingElement,
        },
        selection: {
            hasSelectedElement
        }
    } = useElementsContext()

    const { getLastReferenceClick, selectDelta, addToolProp, tool } = useToolsContext()

    const { getSingleElementTrimResults, getPolylineTrimResults } = useTrimUtils()

    const handleTrimCmd = useCallback(({ mouseX, mouseY }) => {
        if (!tool.isStarted) return

        const lastClick = getLastReferenceClick()
        if (lastClick) {
            addToolProp('mousePosition', { mouseX, mouseY })
        }
        
        const mousePoint = { x: Number(mouseX.toFixed(3)), y: Number(mouseY.toFixed(3)) }
        
        let elementsToTrim = lastClick
                                ? getElementsInContainer(lastClick, mousePoint, false, false)
                                : getElementsContainingPoint(mouseX, mouseY, selectDelta, false)
        
        if (!elementsToTrim) {
            return clearReplacingElements()
        }
        
        elementsToTrim = elementsToTrim.filter(ett => !hasSelectedElement(ett) && !isReplacingElement(ett))
        
        const pointsOfSelection = lastClick ? [lastClick, mousePoint] : [mousePoint]

        const { singleElementCmdResult, polylines } = getSingleElementTrimResults(elementsToTrim, pointsOfSelection)
        const polylineCmdResult = getPolylineTrimResults(polylines, pointsOfSelection)
        const commandResult = { ...singleElementCmdResult, ...polylineCmdResult }


        if (Object.keys(commandResult).length === 0) {
            return clearReplacingElements()
        }

        startReplacingElements(commandResult)
    }, [
        addToolProp, 
        clearReplacingElements, 
        getElementsContainingPoint, 
        getElementsInContainer, 
        getLastReferenceClick, 
        selectDelta, 
        startReplacingElements, 
        hasSelectedElement, 
        isReplacingElement, 
        tool, 
        getSingleElementTrimResults, 
        getPolylineTrimResults
    ])

    return handleTrimCmd
}

export default useTrimCommand