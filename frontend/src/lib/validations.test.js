import assert from 'node:assert/strict'
import { test } from 'node:test'
import { yupResolver } from '@hookform/resolvers/yup'
import { validateRegisterationForm, validateLoginForm } from './validations.js'

const validRegistration = {
  name: 'Test Student',
  email: 'student@xyz.edu',
  password: 'StrongPass1!',
  confirmPassword: 'StrongPass1!',
  id: '01234567',
  role: 'student',
}

test('valid registration reaches the submit handler through the form resolver', async () => {
  const result = await yupResolver(validateRegisterationForm)(
    validRegistration,
    {},
    { shouldUseNativeValidation: false },
  )

  assert.deepEqual(result.errors, {})
  assert.deepEqual(result.values, validRegistration)
})

test('login accepts the same valid email and password as registration', async () => {
  await validateLoginForm.validate({
    email: validRegistration.email,
    password: validRegistration.password,
  })
})

for (const [requirement, password] of [
  ['lowercase letter', 'PASSWORD1!'],
  ['uppercase letter', 'password1!'],
  ['digit', 'Password!!'],
  ['special character', 'Password12'],
  ['eight characters', 'Pass1!'],
]) {
  test(`registration rejects passwords missing a ${requirement}`, async () => {
    await assert.rejects(
      validateRegisterationForm.validateAt('password', {
        ...validRegistration,
        password,
        confirmPassword: password,
      }),
      { path: 'password' },
    )
  })
}

for (const id of ['1234567', '123456789', '1234abcd', '1234.678']) {
  test(`registration rejects invalid employee/student ID ${id}`, async () => {
    await assert.rejects(
      validateRegisterationForm.validateAt('id', { ...validRegistration, id }),
      { path: 'id' },
    )
  })
}

test('registration rejects mismatched passwords', async () => {
  await assert.rejects(
    validateRegisterationForm.validateAt('confirmPassword', {
      ...validRegistration,
      confirmPassword: 'DifferentPass1!',
    }),
    { path: 'confirmPassword' },
  )
})

test('registration rejects names shorter than the backend minimum', async () => {
  await assert.rejects(
    validateRegisterationForm.validateAt('name', { ...validRegistration, name: 'Al' }),
    { path: 'name' },
  )
})

test('registration accepts admin accounts', async () => {
  await validateRegisterationForm.validate({ ...validRegistration, role: 'admin' })
})

test('registration rejects roles the backend does not support', async () => {
  await assert.rejects(
    validateRegisterationForm.validateAt('role', { ...validRegistration, role: 'staff' }),
    { path: 'role' },
  )
})
