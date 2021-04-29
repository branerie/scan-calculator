import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import useCreateCommand from './useCreateCommand'
import useDragCommand from './useDragCommand'
import useEditCommand from './useEditCommand'
import useSnapCommand from './useSnapCommand'
import useTransformCommand from './useTransformCommand'


const useMouseMoveCommands = () => {
    const {
        elements: {
            currentlyEditedElements,
            currentlyCreatedElement
        },
        selection: {
            selectedPoints
        }
    } = useElementsContext()
    const { mouseDrag, options, tool } = useToolsContext()

    const commands = {
        drag: useDragCommand(),
        snap: useSnapCommand(),
        edit: useEditCommand(),
        create: useCreateCommand(),
        transform: useTransformCommand(),
    }

    const executeMouseMoveCommand = useCallback((event) => {
        if (mouseDrag && event.buttons === 4) {
            commands.drag(event)
            return
        }

        if (options.snap && tool.type !== 'select') {
            commands.snap(event)
        }

        // if (!currentlyEditedElements && !currentlyCreatedElement) return

        if (currentlyEditedElements) {
            if (selectedPoints) {
                commands.edit(event)
            } else {
                commands.transform(event)
            }

            return
        }

        if (currentlyCreatedElement && currentlyCreatedElement.isAlmostDefined) {
            commands.create(event)
            return
        }
    }, [commands, currentlyCreatedElement, currentlyEditedElements, mouseDrag, options.snap, selectedPoints, tool.type])

    return executeMouseMoveCommand
}

export default useMouseMoveCommands