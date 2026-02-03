/**
 * Dependency Injection Tokens for Simulation History Module
 *
 * Using Symbol-based tokens for type-safe dependency injection
 * following ADR-DI-001: Symbol-based DI Tokens for NestJS
 */

// Repository Token
export const SIMULATION_HISTORY_REPOSITORY = Symbol('ISimulationHistoryRepository');

// Use Case Tokens
export const CREATE_SIMULATION_HISTORY_USE_CASE = Symbol('CreateSimulationHistoryUseCase');
export const LIST_SIMULATION_HISTORY_USE_CASE = Symbol('ListSimulationHistoryUseCase');
export const GET_SIMULATION_HISTORY_USE_CASE = Symbol('GetSimulationHistoryUseCase');
export const UPDATE_SIMULATION_STATUS_USE_CASE = Symbol('UpdateSimulationStatusUseCase');
export const DELETE_SIMULATION_HISTORY_USE_CASE = Symbol('DeleteSimulationHistoryUseCase');
