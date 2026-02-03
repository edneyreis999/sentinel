import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { PrismaModule } from './database/prisma.module';
import { AppModule as AppGraphqlModule } from './nest-modules/app/app.module';
import { HealthModule } from './nest-modules/health/health.module';
import { UserPreferencesModule } from './nest-modules/user-preferences-module/user-preferences.module';
import { SimulationHistoryModule } from './nest-modules/simulation-history-module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      sortSchema: true,
      playground: true,
      csrfPrevention: false,
    }),
    HealthModule,
    AppGraphqlModule,
    UserPreferencesModule,
    SimulationHistoryModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
