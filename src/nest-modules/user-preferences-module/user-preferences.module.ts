import { Module } from '@nestjs/common';
import { UserPreferencesResolver } from './resolvers/user-preferences.resolver';
import { USER_PREFERENCES_PROVIDERS } from './user-preferences.providers';
import { PrismaModule } from '@database';

/**
 * UserPreferencesModule
 *
 * NestJS module for UserPreferences functionality.
 * Configures providers and resolvers following Clean Architecture.
 */
@Module({
  imports: [PrismaModule],
  providers: [...USER_PREFERENCES_PROVIDERS, UserPreferencesResolver],
  exports: [...USER_PREFERENCES_PROVIDERS],
})
export class UserPreferencesModule {}
