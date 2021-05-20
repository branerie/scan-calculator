import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createPoint } from '../../utils/elementFactory'
import { getOrthoCoordinates } from '../../utils/options'
import useCopyCommand from './useCopyCommand'
import useDrawCommand from './useDrawCommand'
import useEditCommand from './useEditCommand'
import useSelectCommand from './useSelectCommand'
import useTransformCommand from './useTransformCommand'

const useMouseClickCommands = () => {
    const {
        elements: {
            snappedPoint
        }
    } = useElementsContext()

    const { tool, getRealMouseCoordinates, options } = useToolsContext()

    const commands = {
        copy: useCopyCommand(),
        draw: useDrawCommand(),
        select: useSelectCommand(),
        edit: useEditCommand(),
        transform: useTransformCommand()
    }

    const executeMouseClickCommand = useCallback((event) => {
        if (!(tool.type in commands)) {
            return
        }

        let [realClientX, realClientY] = getRealMouseCoordinates(event.clientX, event.clientY)
        if (tool.type !== 'select' && options.ortho && tool.clicks) {
            const lastClick = tool.clicks[tool.clicks.length - 1]
            const [finalX, finalY] = getOrthoCoordinates(lastClick.x, lastClick.y, realClientX, realClientY)
            realClientX = finalX
            realClientY = finalY
        }

        const clickedPoint = snappedPoint ? snappedPoint : createPoint(realClientX, realClientY)

        commands[tool.type](event, clickedPoint)
    }, [commands, getRealMouseCoordinates, snappedPoint, tool.type, tool.clicks, options.ortho])

    return executeMouseClickCommand
}

export default useMouseClickCommands