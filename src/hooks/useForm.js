import { useState } from 'react'

const useForm = (initialValues) => {
    const [values, setValues] = useState(initialValues || {})

    const changeValue = (event) => {
        setValues({
            ...values,
            [event.target.name]: event.target.value
        })
    }

    return [
        values,
        changeValue
    ]
}

export default useForm