import { Field, ObjectType, ID, Int, registerEnumType } from '@nestjs/graphql';

/**
 * GraphQL Enum for ThemeMode
 */
export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM',
}

registerEnumType(ThemeMode, {
  name: 'ThemeMode',
  description: 'Theme mode for user interface',
});

/**
 * GraphQL Object Type for UserPreferences
 */
@ObjectType('UserPreferences')
export class UserPreferencesGraphQL {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => ThemeMode)
  theme!: ThemeMode;

  @Field(() => String)
  language!: string;

  @Field(() => Int)
  windowWidth!: number;

  @Field(() => Int)
  windowHeight!: number;

  @Field(() => Int, { nullable: true })
  windowX?: number | null;

  @Field(() => Int, { nullable: true })
  windowY?: number | null;

  @Field(() => Boolean)
  windowIsMaximized!: boolean;

  @Field(() => Int)
  autoSaveInterval!: number;

  @Field(() => Int)
  maxHistoryEntries!: number;

  @Field(() => String, { nullable: true })
  lastProjectPath?: string | null;

  @Field(() => Date, { nullable: true })
  lastOpenDate?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
