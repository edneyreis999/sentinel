import { Field, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL Object Type for Success Response
 */
@ObjectType()
export class SuccessResponse {
  @Field()
  success!: boolean;
}
