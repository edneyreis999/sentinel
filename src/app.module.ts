import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { PrismaModule } from './database/prisma.module';
import { AppModule as AppGraphqlModule } from './nest-modules/app/app.module';
import { HealthModule } from './nest-modules/health/health.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      sortSchema: true,
      playground: true,
      csrfPrevention: false,
    }),
    HealthModule,
    AppGraphqlModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
