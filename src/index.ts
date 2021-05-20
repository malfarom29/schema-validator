import { plainToClass } from "class-transformer";
import { validate, ValidationError } from "class-validator";

type ValidationErrorObject = {
  whitelisted: ValidationError[];
  nonWhitelisted: ValidationError[];
};

declare type ClassType<T> = {
  new (...args: any[]): T;
};

/**
 *
 * @param providerSchema Schema to validate. It must have the validation with class-validator library.
 * @param params Object to validate against the schema.
 * @param forbidNonWhitelisted Optional field. It will validate if the nonWhitelisted properties should be forbidden or not.
 * @returns \{ whitelisted: ValidationError[]; nonWhitelisted: ValidationError[] \}
 */

export async function schemaValidator<T>(
  providerSchema: ClassType<T>,
  params: Record<string, unknown>,
  forbidNonWhitelisted = true
): Promise<ValidationErrorObject> {
  const schema = plainToClass(providerSchema, params);
  const errors = await validate(schema, {
    whitelist: true,
    forbidNonWhitelisted,
    validationError: { target: false, value: false },
  });

  const { whitelisted, nonWhitelisted } = splitErrors(errors);

  return { whitelisted, nonWhitelisted };
}

function splitErrors(errors: ValidationError[]) {
  const nonWhitelisted = nonWhitelistErrors(errors)
    .filter(Boolean)
    .reduce((acc, val) => acc.concat(val), []);
  const whitelisted = whitelistErrors(errors)
    .filter(Boolean)
    .reduce((acc, val) => acc.concat(val), []);

  return { whitelisted, nonWhitelisted };
}

function nonWhitelistErrors(errors: ValidationError[]): ValidationError[] {
  return errors?.map((error) => {
    if (error.children?.length > 0) {
      const errorChildren = nonWhitelistErrors(error.children);
      return childrenLength(errorChildren, error);
    }

    const [key] = Object.keys(error.constraints);
    if (key === "whitelistValidation") return error;
  });
}

function whitelistErrors(errors: ValidationError[]): ValidationError[] {
  return errors?.map((error) => {
    if (error.children?.length > 0) {
      const errorChildren = whitelistErrors(error.children);
      return childrenLength(errorChildren, error);
    }

    const [key] = Object.keys(error.constraints);
    if (key !== "whitelistValidation") return error;
  });
}

function childrenLength(
  errorChildren: ValidationError[],
  error: ValidationError
): ValidationError | undefined {
  if (errorChildren.length > 0) {
    const children = errorChildren
      .filter(Boolean)
      .reduce((acc, val) => acc.concat(val), []);
    if (children.length > 0) {
      return { ...error, children };
    }
  }
}
