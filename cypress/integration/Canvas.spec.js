import { click, matchSnapshot, mousePan, pressEnter, pressEscape, pressDelete, selectTool, zoom } from '../utils/canvas'
import { redo, undo, visitPage } from '../utils/main'

/* eslint-disable no-undef */
describe('<Canvas />', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    const drawElements = () => {
        // draw line
        selectTool('line')
        click(50, 50)
        click(100, 100)

        // draw polyline
        selectTool('polyline')
        click(100, 150)
        click(80, 180)
        click(120, 180)
        click(120, 190)
        pressEnter()
        pressEscape()

        // draw arc
        selectTool('arc')
        click(300, 250)
        click(250, 250)
        click(200, 250)

        // draw circle
        selectTool('circle')
        click(350, 350)
        click(200, 350)

        // draw rectangle
        selectTool('rectangle')

        click(350, 300)
        click(600, 600)

        pressEscape()
    }

    const undoOneStepEdit = () => {
        selectTool('rectangle')
        click(350, 300)
        click(600, 600)
        pressEscape()

        click(600, 600)
        click(600, 600)
        click(700, 730)

        click(350, 300)
        click(400, 460)
        pressEscape()

        undo()
    }

    const undoMultiStepEdit = () => {
        selectTool('rectangle')
        click(350, 300)
        click(600, 600)
        pressEscape()

        click(600, 600)
        click(600, 300)
        click(700, 200)

        click(600, 600)
        click(700, 730)

        click(350, 300)
        click(400, 460)

        pressEscape()

        undo()
        undo()
    }

    const undoMultiElementEdit = () => {
        drawElements()

        click(120, 190)
        click(120, 190)
        click(150, 390)

        click(600, 600)
        click(600, 600)
        click(700, 820)

        click(80, 180)
        click(80, 310)

        click(200, 350)
        click(350, 350)
        click(500, 500)

        undo()
        undo()
    }

    it('should select clicked elements', () => {
        drawElements()

        click(350, 500)
        click(80, 80)
    })

    it('should pan correctly', () => {
        drawElements()

        mousePan(200, 200, 400, 400)
        mousePan(300, 300, 100, 300)
    })

    it('should zoom correctly', () => {
        drawElements()

        zoom(3, 150, 150, true)
        zoom(6, 100, 100, false)
        zoom(3, 200, 200, true)
    })

    it('should undo element creation correctly with 1 step', () => {
        drawElements()

        undo()
    })

    it('should undo element creation correctly with > 1 steps', () => {
        drawElements()

        undo()
        undo()
    })

    it('should undo element deletion correctly with 1 step', () => {
    drawElements()

    click(50, 50)
    pressDelete()

    click(350, 400)
    pressDelete()

        undo()
    })

    it('should undo element deletion correctly with > 1 steps', () => {
        drawElements()

        click(200, 350)
        pressDelete()

        click(50, 50)
        pressDelete()

        click(350, 400)
        pressDelete()

        undo()
        undo()
    })

    it('should undo element edit correctly with 1 step', () => {
        undoOneStepEdit()
    })

    it('should undo element edit correctly with > 1 steps', () => {
        undoMultiStepEdit()
    })

    it('should undo element edit correctly with different elements edited', () => {
        undoMultiElementEdit()
    })

    it('should redo element creation correctly with 1 step', () => {
        drawElements()
        undo()
        undo()
        redo()
    })

    it('should redo element creation correctly with > 1 steps', () => {
        drawElements()
        undo()
        undo()
        redo()
        redo()
    })

    it('should redo element deletion correctly with 1 step', () => {
        drawElements()

        click(50, 50)
        pressDelete()

        click(350, 400)
        pressDelete()

        undo()
        undo()
        redo()
    })

    it('should redo element deletion correctly with > 1 steps', () => {
        drawElements()

        click(200, 350)
        pressDelete()

        click(50, 50)
        pressDelete()

        click(350, 400)
        pressDelete()

        undo()
        undo()

        redo()
        redo()
    })

    it('should redo element edit correctly with 1 step', () => {
        undoOneStepEdit()

        redo()
    })

    it('should redo element edit correctly with > 1 steps', () => {
        undoMultiStepEdit()

        redo()
        redo()
    })

    it('should redo element edit correctly with different elements edited', () => {
        undoMultiElementEdit()

        redo()
        redo()
    })
})