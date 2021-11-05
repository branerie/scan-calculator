import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import useCreateCommand from './useCreateCommand'
import useCopyCommand from './useCopyCommand'
import useDragCommand from './useDragCommand'
import useEditCommand from './useEditCommand'
import useSnapCommand from './useSnapCommand'
import useSelectCommand from './useSelectCommand'
import useTransformCommand from './useTransformCommand'
import useTrimCommand from './useTrimCommand'
import useExtendCommand from './useExtendCommand'
import { getOrthoCoordinates } from '../../utils/options'
import { createLine } from '../../utils/elementFactory'


const useMouseMoveCommands = () => {
    const {
        elements: {
            currentlyEditedElements,
            currentlyCreatedElement,
            currentlyCopiedElements,
            snappedPoint,
        },
        selection: {
            selectedPoints
        }
    } = useElementsContext()
    const { mouseDrag, options, tool, getRealMouseCoordinates, getLastReferenceClick, addToolProp } = useToolsContext()

    const commands = {
        drag: useDragCommand(),
        snap: useSnapCommand(),
        edit: useEditCommand(),
        create: useCreateCommand(),
        transform: useTransformCommand(),
        copy: useCopyCommand(),
        select: useSelectCommand(),
        trim: useTrimCommand(),
        extend: useExtendCommand(),
    }

    const executeMouseMoveCommand = useCallback((event) => {
        if (mouseDrag && event.buttons === 4) {
            commands.drag(event)
            return
        }

        let [realClientX, realClientY] = getRealMouseCoordinates(event.clientX, event.clientY)
        
        if (options.snap && tool.type !== 'select' && tool.type !== 'trim') {
            commands.snap({ mouseX: realClientX, mouseY: realClientY })
        }
        
        if (options.ortho && tool.clicks && !snappedPoint && tool.type !== 'trim') {
            const lastClick = getLastReferenceClick()
            if (lastClick) {
                const [finalX, finalY] = getOrthoCoordinates(lastClick.x, lastClick.y, realClientX, realClientY)
                realClientX = finalX
                realClientY = finalY
            }
        }
        
        if (snappedPoint && tool.type !== 'trim') {
            // [realClientX, realClientY] = getRealMouseCoordinates(snappedPoint.x, snappedPoint.y)
            realClientX = snappedPoint.x
            realClientY = snappedPoint.y
        }
        
        const realMousePosition = { mouseX: realClientX, mouseY: realClientY }

        if (tool.type === 'trim') {
            let isTrim = tool.name === 'trim'
            if (event.shiftKey) {
                isTrim = !isTrim
            }

            if (isTrim) {
                commands.trim(realMousePosition)
            } else {
                commands.extend(realMousePosition)
            }

            return
        }
        
        if (tool.clicks) {
            if (tool.name === 'select') {
                commands.select(realMousePosition)
                return
            }

            const refClick = getLastReferenceClick()
            if (refClick) {
                const toolLine = createLine(refClick.x, refClick.y, realClientX, realClientY)
                addToolProp('line', toolLine)
            }
        }
        
        // if (!currentlyEditedElements && !currentlyCreatedElement) return
        
        if (currentlyEditedElements) {
            if (selectedPoints) {
                commands.edit(realMousePosition)
            } else {
                commands.transform(realMousePosition)
            }

            return
        }

        if (currentlyCreatedElement && currentlyCreatedElement.isAlmostDefined) {
            commands.create(realMousePosition)
            return
        }

        if (currentlyCopiedElements) {
            commands.copy(realMousePosition)
        }
    }, [
        commands, 
        currentlyCreatedElement, 
        currentlyEditedElements, 
        currentlyCopiedElements,
        mouseDrag, 
        options.snap, 
        options.ortho,
        selectedPoints, 
        tool.type,
        tool.name,
        tool.clicks,
        snappedPoint,
        getRealMouseCoordinates,
        getLastReferenceClick,
        addToolProp
    ])

    return executeMouseMoveCommand
}

export default useMouseMoveCommands