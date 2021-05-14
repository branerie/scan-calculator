import { click, matchSnapshot, moveMouse, pressEnter, pressEscape, selectTool } from '../../../utils/canvas'
import { undo, visitPage } from '../../../utils/main'
import { createAndSelectMultipleElements } from './utils'

describe('Elements scale command', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should scale single element correctly', () => {
        selectTool('polyline')
        click(50, 50)
        click(150, 150)
        click(180, 220)
        click(100, 280)
        click(400, 230)
        pressEnter()
        pressEscape()

        click(50, 50)
        selectTool('scale')

        click(50, 50)
        click(50, 125)
    })

    it('should scale multiple elements correctly (selected only)', () => {
        createAndSelectMultipleElements()

        selectTool('scale')
        click(300, 300)
        click(300, 340)
    })

    it('should scale elements with mouse while executing scale command', () => {
        createAndSelectMultipleElements()

        selectTool('scale')
        click(500, 500)
        moveMouse(500, 540)
    })

    it('should undo scale correctly', () => {
        createAndSelectMultipleElements()

        selectTool('scale')
        click(300, 300)
        click(300, 340)

        undo()
    })
})