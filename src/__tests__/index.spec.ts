import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { schemaValidator } from "../index";

class DataSchema {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}

class NestedSchema {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ValidateNested()
  @Type(() => DataSchema)
  data: DataSchema[];
}

describe("Schema Validator", () => {
  describe("NestedSchema", () => {
    describe("forbidNonWhitelisted to true", () => {
      let result;

      beforeAll(async () => {
        result = await schemaValidator(NestedSchema, {
          id: 1,
          data: [{ name: 5, lastName: "Doe" }],
        });
      });

      it("should have whitelisted and nonWhitelisted properties", () => {
        expect(result).toHaveProperty("whitelisted");
        expect(result).toHaveProperty("nonWhitelisted");
      });

      it("should have a length of zero for whitelisted property", () => {
        const { whitelisted } = result;

        expect(Array.isArray(whitelisted)).toBeTruthy();
        expect(whitelisted.length).toBeGreaterThan(0);
      });

      it("should have a length greater than zero for nonWhitelisted property", () => {
        const { nonWhitelisted } = result;

        expect(Array.isArray(nonWhitelisted)).toBeTruthy();
        expect(nonWhitelisted.length).toBeGreaterThan(0);
      });
    });

    describe("forbidNonWhitelisted to false", () => {
      let result;

      beforeAll(async () => {
        result = await schemaValidator(
          NestedSchema,
          {
            id: 1,
            data: [{ name: "John", lastName: "Doe" }],
          },
          false
        );
      });

      it("should not return nonWhitelisted values", () => {
        const { nonWhitelisted } = result;

        expect(Array.isArray(nonWhitelisted)).toBeTruthy();
        expect(nonWhitelisted.length).toEqual(0);
      });
    });

    describe("when all properties are with the correct type", () => {
      it("should have a length of zero for both properties, even when quantity is not present", async () => {
        const result = await schemaValidator(NestedSchema, {
          id: 1,
          data: [{ name: "John" }],
        });

        expect(result).toHaveProperty("whitelisted");
        expect(result).toHaveProperty("nonWhitelisted");

        const { whitelisted, nonWhitelisted } = result;

        expect(Array.isArray(whitelisted)).toBeTruthy();
        expect(whitelisted.length).toEqual(0);
        expect(Array.isArray(nonWhitelisted)).toBeTruthy();
        expect(nonWhitelisted.length).toEqual(0);
      });

      it("should have a length of zero for both properties, when quantity is present", async () => {
        const result = await schemaValidator(NestedSchema, {
          id: 1,
          data: [{ name: "John", quantity: 5 }],
        });

        expect(result).toHaveProperty("whitelisted");
        expect(result).toHaveProperty("nonWhitelisted");

        const { whitelisted, nonWhitelisted } = result;

        expect(Array.isArray(whitelisted)).toBeTruthy();
        expect(whitelisted.length).toEqual(0);
        expect(Array.isArray(nonWhitelisted)).toBeTruthy();
        expect(nonWhitelisted.length).toEqual(0);
      });
    });
  });
});
