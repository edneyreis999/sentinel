import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String, {
    description: 'Returns a greeting from the Sentinel API',
  })
  hello(): string {
    return 'Hello from Sentinel API!';
  }

  @Mutation(() => String, {
    description: 'Echoes back the provided message',
  })
  echo(@Args('message', { type: () => String }) message: string): string {
    return message;
  }
}
