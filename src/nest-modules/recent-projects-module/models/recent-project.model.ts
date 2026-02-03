import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

/**
 * GraphQL Object Type for RecentProject
 */
@ObjectType()
export class RecentProject {
  @Field(() => ID)
  id!: string;

  @Field()
  path!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  gameVersion?: string | null;

  @Field(() => String, { nullable: true })
  screenshotPath?: string | null;

  @Field(() => Int, { nullable: true })
  trechoCount?: number | null;

  @Field()
  lastOpenedAt!: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
