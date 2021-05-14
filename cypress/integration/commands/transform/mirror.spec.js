import { click, matchSnapshot, moveMouse, pressEnter, pressEscape, selectTool } from '../../../utils/canvas'
import { undo, visitPage } from '../../../utils/main'
import { createAndSelectMultipleElements } from './utils'

describe('Elements mirror command', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should mirror single element correctly', () => {
        selectTool('polyline')
        click(50, 50)
        click(150, 150)
        click(180, 220)
        click(100, 280)
        click(400, 230)
        pressEnter()
        pressEscape()

        click(50, 50)
        selectTool('mirror')

        click(200, 200)
        click(200, 150)
    })

    it('should mirror multiple elements correctly (selected only)', () => {
        createAndSelectMultipleElements()

        selectTool('mirror')
        click(300, 300)
        click(340, 300)
    })

    it('should mirror elements with mouse while executing mirror command', () => {
        createAndSelectMultipleElements()

        selectTool('mirror')
        click(500, 500)
        moveMouse(520, 580)
    })

    it('should undo mirror correctly', () => {
        createAndSelectMultipleElements()

        selectTool('mirror')
        click(300, 300)
        click(300, 340)

        undo()
    })
})