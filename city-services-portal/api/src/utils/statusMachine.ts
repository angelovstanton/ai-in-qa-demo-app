// State transition definitions
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['TRIAGED', 'REJECTED'],
  TRIAGED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['WAITING_ON_CITIZEN', 'RESOLVED', 'REJECTED'],
  WAITING_ON_CITIZEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REJECTED: ['REOPENED'],
  REOPENED: ['TRIAGED']
};

export type StatusAction = 
  | 'triage' 
  | 'start' 
  | 'wait_for_citizen' 
  | 'resolve' 
  | 'close' 
  | 'reject' 
  | 'reopen';

// Map actions to target statuses
export const ACTION_TO_STATUS: Record<StatusAction, string> = {
  triage: 'TRIAGED',
  start: 'IN_PROGRESS',
  wait_for_citizen: 'WAITING_ON_CITIZEN',
  resolve: 'RESOLVED',
  close: 'CLOSED',
  reject: 'REJECTED',
  reopen: 'REOPENED'
};

export function isValidStatusTransition(currentStatus: string, targetStatus: string): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions ? allowedTransitions.includes(targetStatus) : false;
}

export function getValidActionsForStatus(status: string): StatusAction[] {
  const allowedStatuses = STATUS_TRANSITIONS[status] || [];
  return Object.entries(ACTION_TO_STATUS)
    .filter(([action, targetStatus]) => allowedStatuses.includes(targetStatus))
    .map(([action]) => action as StatusAction);
}