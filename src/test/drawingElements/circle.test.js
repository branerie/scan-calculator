import Circle from '../../drawingElements/circle'
import Line from '../../drawingElements/line'
import Point from '../../drawingElements/point'
import { SELECT_DELTA } from '../../utils/constants'

describe('circle', () => {
    describe('getSelectionPoints', () => {
        it('should return correct selection points', () => {
            const circle = new Circle(new Point(250, 250), { radius: 200 })

            const selectionPoints = circle.getSelectionPoints()

            expect(selectionPoints.some(sp => sp.pointType === 'center' && sp.x === 250 && sp.y === 250)).toEqual(true)

            expect(selectionPoints.some(sp => sp.pointType === 'endPoint' && sp.x === 450 && sp.y === 250)).toEqual(true)
            expect(selectionPoints.some(sp => sp.pointType === 'endPoint' && sp.x === 250 && sp.y === 450)).toEqual(true)
            expect(selectionPoints.some(sp => sp.pointType === 'endPoint' && sp.x === 50 && sp.y === 250)).toEqual(true)
            expect(selectionPoints.some(sp => sp.pointType === 'endPoint' && sp.x === 250 && sp.y === 50)).toEqual(true)
        })
    })

    describe('checkIfPointOnElement', () => {
        it('should return true if point lies on circle', () => {
            const circle = new Circle(new Point(250, 250), { radius: 200 })

            circle.endPoints.forEach(ep => {
                expect(circle.checkIfPointOnElement(ep, SELECT_DELTA)).toEqual(true)
            })

            const randomLineFromCenter = new Line(new Point(250, 250), { pointB: new Point(280, 290) })
            randomLineFromCenter.setLength(circle.radius, false)

            expect(circle.checkIfPointOnElement(randomLineFromCenter.pointB, SELECT_DELTA)).toEqual(true)
        })

        it('should return false if point doesn\'t lie on circle', () => {
            const circle = new Circle(new Point(250, 250), { radius: 200 })

            expect(circle.checkIfPointOnElement(circle.centerPoint, SELECT_DELTA)).toEqual(false)
            expect(circle.checkIfPointOnElement(new Point (240, 240), SELECT_DELTA)).toEqual(false)
        })
    })

    describe('setLastAttribute', () => {
        it('should set radius and end points', () => {
            const circle = new Circle(new Point(200, 200))

            expect(circle.radius).toBeFalsy()
            expect(circle.endPoints).toBeFalsy()

            circle.setLastAttribute(300, 200)

            expect(circle.radius).toEqual(100)
            expect(circle.endPoints.length).toEqual(4)
        })
    })

    describe('getPointById', () => {
        it('should return correct point if valid pointId is passed', () => {
            const centerPoint = new Point(100, 100)
            centerPoint.pointId = 1
            const endPoint = new Point(200, 100)
            endPoint.pointId = 2

            const circle = new Circle(centerPoint, {
                endPoints: [
                    endPoint,
                    new Point(0, 100),
                    new Point(100, 0),
                    new Point(100, 200),
                ]
            })

            const retrievedCenter = circle.getPointById(1)
            expect(retrievedCenter.x).toEqual(100)
            expect(retrievedCenter.y).toEqual(100)

            const retrievedEnd = circle.getPointById(2)
            expect(retrievedEnd.x).toEqual(200)
            expect(retrievedEnd.y).toEqual(100)
        })

        it('should return null if invalid pointId is passed', () => {
            const centerPoint = new Point(100, 100)
            centerPoint.pointId = 1
            const endPoint = new Point(200, 100)
            endPoint.pointId = 2

            const circle = new Circle(centerPoint, {
                endPoints: [
                    endPoint,
                    new Point(0, 100),
                    new Point(100, 0),
                    new Point(100, 200),
                ]
            })

            expect(circle.getPointById(5)).toEqual(null)
        })
    })

    describe('setPointById', () => {
        it('should move whole circle if center is moved', () => {
            const centerPoint = new Point(100, 100)
            centerPoint.pointId = 1

            const circle = new Circle(centerPoint, {
                endPoints: [
                    new Point(200, 100),
                    new Point(0, 100),
                    new Point(100, 0),
                    new Point(100, 200),
                ]
            })

            // should return true if point was successfully set
            expect(circle.setPointById(1, 200, 200)).toEqual(true)

            expect(circle.centerPoint.x).toEqual(200)
            expect(circle.centerPoint.y).toEqual(200)

            expect(circle.endPoints.some(ep => ep.x === 300 && ep.y === 200))
            expect(circle.endPoints.some(ep => ep.x === 100 && ep.y === 200))
            expect(circle.endPoints.some(ep => ep.x === 200 && ep.y === 100))
            expect(circle.endPoints.some(ep => ep.x === 200 && ep.y === 300))
        })

        it('should change radius if endPoint is set', () => {
            const endPoint = new Point(200, 100)
            endPoint.pointId = 2

            const circle = new Circle(new Point(100, 100), {
                endPoints: [
                    endPoint,
                    new Point(0, 100),
                    new Point(100, 0),
                    new Point(100, 200),
                ]
            })

            expect(circle.setPointById(2, 300, 100)).toEqual(true)
            expect(circle.radius).toEqual(200)

            // check if all endpoints moved
            expect(circle.endPoints.some(ep => ep.x === 300 && ep.y === 100)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === -100 && ep.y === 100)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === 100 && ep.y === -100)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === 100 && ep.y === 300)).toEqual(true)
        })

        it('should return falsei if point not found', () => {
            const endPoint = new Point(200, 100)
            endPoint.pointId = 2

            const circle = new Circle(new Point(100, 100), {
                endPoints: [
                    endPoint,
                    new Point(0, 100),
                    new Point(100, 0),
                    new Point(100, 200),
                ]
            })

            expect(circle.setPointById(5)).toEqual(false)
        })
    })

    describe('move', () => {
        it('should move all points on circle', () => {
            const circle = new Circle(new Point(100, 100), {
                endPoints: [
                    new Point(200, 100),
                    new Point(0, 100),
                    new Point(100, 0),
                    new Point(100, 200),
                ]
            })

            circle.move(100, 100)

            expect(circle.centerPoint.x).toEqual(200)
            expect(circle.centerPoint.y).toEqual(200)

            expect(circle.endPoints.some(ep => ep.x === 300 && ep.y === 200)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === 100 && ep.y === 200)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === 200 && ep.y === 100)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === 200 && ep.y === 300)).toEqual(true)

            circle.move(-50, -50)

            expect(circle.centerPoint.x).toEqual(150)
            expect(circle.centerPoint.y).toEqual(150)

            expect(circle.endPoints.some(ep => ep.x === 250 && ep.y === 150)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === 50 && ep.y === 150)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === 150 && ep.y === 50)).toEqual(true)
            expect(circle.endPoints.some(ep => ep.x === 150 && ep.y === 250)).toEqual(true)
        })
    })
})