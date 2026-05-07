import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(ValidationPipe.name);
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    this.logger.debug(`Validating object: ${JSON.stringify(object)}`);
    const errors = await validate(object);
    if (errors.length > 0) {
      this.logger.debug(`Validation errors: ${JSON.stringify(errors)}`);
      const messages = errors.map(err => Object.values(err.constraints)).join(', ');
      throw new BadRequestException(`Validation failed: ${messages}`);
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}