import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import useCreateCommand from './useCreateCommand'
import useCopyCommand from './useCopyCommand'
import useDragCommand from './useDragCommand'
import useEditCommand from './useEditCommand'
import useSnapCommand from './useSnapCommand'
import useTransformCommand from './useTransformCommand'


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
    const { mouseDrag, options, tool, getRealMouseCoordinates } = useToolsContext()

    const commands = {
        drag: useDragCommand(),
        snap: useSnapCommand(),
        edit: useEditCommand(),
        create: useCreateCommand(),
        transform: useTransformCommand(),
        copy: useCopyCommand(),
    }

    const executeMouseMoveCommand = useCallback((event) => {
        if (mouseDrag && event.buttons === 4) {
            commands.drag(event)
            return
        }

        let [realClientX, realClientY] = getRealMouseCoordinates(event.clientX, event.clientY)

        if (options.ortho && tool.clicks) {
            const lastClick = tool.clicks[tool.clicks.length - 1]

            const xDiff = Math.abs(lastClick.x - realClientX)
            const yDiff = Math.abs(lastClick.y - realClientY)

            if (xDiff < yDiff) {
                realClientX = lastClick.x
            } else {
                realClientY = lastClick.y
            }
        }

        if (options.snap && tool.type !== 'select') {
            commands.snap({ mouseX: realClientX, mouseY: realClientY })
        }

        if (snappedPoint) {
            [realClientX, realClientY] = getRealMouseCoordinates(snappedPoint.x, snappedPoint.y)
        }

        const realMousePosition = { mouseX: realClientX, mouseY: realClientY }

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
        tool.clicks,
        snappedPoint,
        getRealMouseCoordinates
    ])

    return executeMouseMoveCommand
}

export default useMouseMoveCommands