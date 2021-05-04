import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createPoint } from '../../utils/elementFactory'
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

    const { tool, getRealMouseCoordinates } = useToolsContext()

    const commands = {
        copy: useCopyCommand(),
        draw: useDrawCommand(),
        select: useSelectCommand(),
        edit: useEditCommand(),
        transform: useTransformCommand()
    }

    const executeKeyPressCommand = useCallback((event) => {
        if (!(tool.type in commands)) {
            return
        }

        const [realClientX, realClientY] = getRealMouseCoordinates(event.clientX, event.clientY)
        const clickedPoint = snappedPoint ? snappedPoint : createPoint(realClientX, realClientY)

        commands[tool.type](event, clickedPoint)
    }, [commands, getRealMouseCoordinates, snappedPoint, tool.type])

    return executeKeyPressCommand
}

export default useMouseClickCommands