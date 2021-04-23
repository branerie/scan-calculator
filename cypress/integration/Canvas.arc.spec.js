import { click, pressEscape, selectDrawingTool, matchSnapshot, moveMouse } from '../utils/canvas'
import { visitPage } from '../utils/main'

/* eslint-disable no-undef */
describe('Canvas.line', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should draw arc correctly', () => {
        selectDrawingTool('arc')
    
        click(100, 100)
        click(150, 100)
        click(100, 50)
    
        click(300, 300)
        click(350, 350)
        click(250, 350)
    
        click(500, 500)
        click(550, 450)
        click(550, 550)
    
        click(400, 200)
        click(460, 260)
        click(460, 140)
    })

    it('should edit arc correctly by clicking endpoint', () => {
        selectDrawingTool('arc')

        click(100, 100)
        click(150, 100)
        click(100, 50)

        click(300, 300)
        click(350, 300)
        click(300, 250)

        pressEscape()

        click(150, 100)
        click(150, 100)
        click(150, 150)

        click(350, 300)
        click(300, 250)
        click(300, 350)
    })

    it('should modify arc radius by clicking midpoint and location by clicking center', () => {
        selectDrawingTool('arc')

        click(200, 200)
        click(200, 300)
        click(200, 100)

        pressEscape()

        click(300, 200)
        click(300, 200)
        click(500, 200)

        click(200, 200)
        click(400, 400)
    })

    it('should display arc selection points correctly', () => {
        selectDrawingTool('arc')

        click(200, 200)
        click(200, 300)
        click(200, 100)

        click(600, 600)
        click(500, 600)
        click(700, 600)

        click(400, 400)
        click(450, 450)
        click(450, 350)

        click(200, 400)
        click(250, 450)
        click(150, 350)

        click(500, 500)
        click(550, 450)
        click(550, 550)

        pressEscape()

        // select arcs
        click(300, 200)
        click(600, 700)
        click(450, 350)
        click(250, 450)
        click(550, 450)
    })

    it('should snap to selection points', () => {
        selectDrawingTool('arc')

        click(200, 200)
        click(300, 200)
        click(100, 200)

        // snap arc center
        click(205, 202)

        // snap arc endpoint
        click(96, 202)

        // finish new arc
        click(200, 300)
    })

    it('should display center snap correctly', () => {
        selectDrawingTool('arc')

        click(200, 200)
        click(300, 200)
        click(100, 200)

        moveMouse(205, 202)
    })

    it('should display end point snap correctly', () => {
        selectDrawingTool('arc')

        click(200, 200)
        click(300, 200)
        click(100, 200)

        moveMouse(96, 202)
    })
})