import {
  getFromContainer,
  MetadataStorage,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'
import * as _ from 'lodash'

import { validationMetadatasToSchemas } from '../src'

@ValidatorConstraint()
export class CustomTextLength implements ValidatorConstraintInterface {
  validate(text: string, validationArguments: ValidationArguments) {
    const [min, max] = validationArguments.constraints
    return text.length > min && text.length < max
  }
}

// @ts-ignore: not referenced
class Post {
  @Validate(CustomTextLength, [0, 11])
  title: string
}

const storage = getFromContainer(MetadataStorage)

describe('custom validation classes', () => {
  it('uses property type if no additional converter is supplied', () => {
    const schemas = validationMetadatasToSchemas(
      _.get(storage, 'validationMetadatas')
    )
    expect(schemas.Post).toEqual({
      properties: {
        title: { type: 'string' }
      },
      required: ['title'],
      type: 'object'
    })
  })

  it('uses additionalConverter to generate schema when supplied', () => {
    const schemas = validationMetadatasToSchemas(
      _.get(storage, 'validationMetadatas'),
      {
        additionalConverters: {
          customValidation: meta => {
            if (meta.constraintCls === CustomTextLength) {
              return {
                maxLength: meta.constraints[1] - 1,
                minLength: meta.constraints[0] + 1,
                type: 'string'
              }
            }
            return {}
          }
        }
      }
    )

    expect(schemas.Post).toEqual({
      properties: {
        title: { maxLength: 10, minLength: 1, type: 'string' }
      },
      required: ['title'],
      type: 'object'
    })
  })
})
