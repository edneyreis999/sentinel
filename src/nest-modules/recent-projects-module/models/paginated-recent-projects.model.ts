import { Field, ObjectType } from '@nestjs/graphql';
import { RecentProject } from './recent-project.model';

/**
 * GraphQL Object Type for Paginated Meta
 */
@ObjectType()
export class PaginatedMeta {
  @Field()
  total!: number;

  @Field()
  page!: number;

  @Field()
  perPage!: number;

  @Field()
  lastPage!: number;
}

/**
 * GraphQL Object Type for Paginated Recent Projects
 */
@ObjectType()
export class PaginatedRecentProjects {
  @Field(() => [RecentProject])
  data!: RecentProject[];

  @Field(() => PaginatedMeta)
  meta!: PaginatedMeta;
}
