import Line from '../../drawingElements/line'
import Point from '../../drawingElements/point'

describe('line', () => {
    describe('length', () => {
        it('should give correct length for vertical and horizontal lines', () => {
            const verticalLine = new Line(new Point(100, 100), { pointB: new Point(100, 200) })
            const horizontalLine = new Line(new Point(100, 100), { pointB: new Point(200, 100) })

            expect(verticalLine.length).toEqual(100)
            expect(horizontalLine.length).toEqual(100)
        })

        it('should give correct length for slanted line', () => {
            const line = new Line(new Point(100, 100), { pointB: new Point(150, 150) })

            expect(line.length).toEqual(Math.sqrt(2 * 50 ** 2))
        })
    })

    describe('angle', () => {
        it('should give correct angle for vertical and horizontal lines', () => {
            const lineAngle0 = new Line(new Point(100, 100), { pointB: new Point(200, 100) })
            const lineAngle90 = new Line(new Point(100, 100), { pointB: new Point(100, 200) })
            const lineAngle180 = new Line(new Point(100, 100), { pointB: new Point(50, 100) })
            const lineAngle270 = new Line(new Point(100, 100), { pointB: new Point(100, 50) })

            expect(lineAngle0.angle).toEqual(0)
            expect(lineAngle90.angle).toEqual(90)
            expect(lineAngle180.angle).toEqual(180)
            expect(lineAngle270.angle).toEqual(270)
        })
    })
})