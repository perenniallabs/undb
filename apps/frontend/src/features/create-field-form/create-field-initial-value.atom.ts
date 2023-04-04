import type { ICreateFieldCommandInput } from '@egodb/cqrs'
import { atom } from 'jotai'
import type { SetRequired } from 'type-fest'

export const createFieldInitialValueAtom = atom<
  SetRequired<Partial<ICreateFieldCommandInput['field']>, 'type' | 'name'>
>({
  type: 'string',
  name: '',
})
