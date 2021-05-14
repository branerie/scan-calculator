class SetUtils {
    static union(setA, setB) {
        let _union = new Set(setA)
        for (let element of setB) {
            _union.add(element)
        }

        return _union
    }
}

export default SetUtils