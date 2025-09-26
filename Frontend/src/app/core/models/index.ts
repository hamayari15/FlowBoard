// Export all model interfaces from a central location
export * from './user.model';
export * from './auth.model';
export * from './workspace.model';
export * from './project.model';
export * from './task.model';
export * from './board.model';
export * from './comment.model';
export * from './api-response.model';

// Convenience re-exports for commonly used populated interfaces
export type { WorkspacePopulated } from './workspace.model';
export type { ProjectPopulated } from './project.model';
export type { TaskPopulated } from './task.model';
export type { BoardPopulated } from './board.model';
export type { CommentPopulated } from './comment.model';