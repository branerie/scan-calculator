import { useState, ChangeEvent, ChangeEventHandler } from 'react'

const useForm = (initialValues: {[key: string]: string}): [
  { [key: string]: string }, 
  ChangeEventHandler
] => {
  const [values, setValues] = useState(initialValues || {})

  const changeValue: ChangeEventHandler = (event: ChangeEvent<HTMLInputElement>) => {
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