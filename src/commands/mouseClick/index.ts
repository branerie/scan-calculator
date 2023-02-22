import { MouseEvent, useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import { useToolsStore } from '../../stores/tools/index'
import { createPoint } from '../../utils/elementFactory'
import { getOrthoCoordinates } from '../../utils/options'
import { copyPoint } from '../../utils/point'
import useCopyCommand from './useCopyCommand'
import useDrawCommand from './useDrawCommand'
import useEditCommand from './useEditCommand'
import useSelectCommand from './useSelectCommand'
import useTransformCommand from './useTransformCommand'
import useTrimCommand from './useTrimCommand'

const useMouseClickCommands = () => {
  const useElementsStore = useElementsStoreContext()
  const snappedPoint = useElementsStore((state) => state.snappedPoint)

  const tool = useToolsStore((state) => state.tool)
  const toolClicks = useToolsStore((state) => state.toolClicks)
  const getRealMouseCoordinates = useToolsStore((state) => state.getRealMouseCoordinates)
  const toolOptions = useToolsStore((state) => state.options)

  const copy = useCopyCommand()
  const draw = useDrawCommand()
  const select = useSelectCommand()
  const edit = useEditCommand()
  const transform = useTransformCommand()
  const trim = useTrimCommand()

  const executeMouseClickCommand = useCallback(
    (event: MouseEvent) => {
      let [realClientX, realClientY] = getRealMouseCoordinates(event.clientX, event.clientY)
      if (tool.type !== 'select' && toolOptions.ortho && toolClicks) {
        const lastClick = toolClicks[toolClicks.length - 1]
        const [finalX, finalY] = getOrthoCoordinates(lastClick.x, lastClick.y, realClientX, realClientY)
        realClientX = finalX
        realClientY = finalY
      }

      const clickedPoint = snappedPoint ? copyPoint(snappedPoint, false, true) : createPoint(realClientX, realClientY)

      switch (tool.type) {
        case 'copy':
          copy(clickedPoint)
          break
        case 'draw':
          draw(clickedPoint)
          break
        case 'edit':
          edit()
          break
        case 'select':
          select(event, clickedPoint)
          break
        case 'transform':
          transform(clickedPoint)
          break
        case 'trim':
          trim(clickedPoint)
          break
      }
    },
    [
      copy,
      draw,
      edit,
      getRealMouseCoordinates,
      select,
      snappedPoint,
      tool.type,
      toolClicks,
      toolOptions.ortho,
      transform,
      trim,
    ]
  )

  return executeMouseClickCommand
}

export default useMouseClickCommands
