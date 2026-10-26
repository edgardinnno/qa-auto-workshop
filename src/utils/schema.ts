import { expect } from '@playwright/test';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import openapi from '../api/openapi.json';

/**
 * JSON Schema validation against `components.schemas` of the vendored /openapi.json.
 * Refresh the snapshot when the API contract changes on purpose:
 *   curl -s <API host>/openapi.json -o src/api/openapi.json
 */
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(openapi as object, 'openapi');

export type SchemaName = keyof typeof openapi.components.schemas;

export function expectSchema(data: unknown, schema: SchemaName): void {
  const validate = ajv.getSchema(`openapi#/components/schemas/${schema}`);
  if (!validate) throw new Error(`Schema "${schema}" not found in openapi.json`);
  const valid = validate(data);
  expect(
    valid,
    `Response does not match schema "${schema}":\n${ajv.errorsText(validate.errors, { separator: '\n' })}`,
  ).toBe(true);
}
