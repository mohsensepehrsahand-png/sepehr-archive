// Custom events for cross-component communication

export const PROJECT_EVENTS = {
  RESTORED: 'project-restored',
  DELETED: 'project-deleted',
  CREATED: 'project-created',
  UPDATED: 'project-updated'
} as const;

export const USER_EVENTS = {
  RESTORED: 'user-restored',
  DELETED: 'user-deleted',
  CREATED: 'user-created',
  UPDATED: 'user-updated'
} as const;

// Helper functions to dispatch events
export const dispatchProjectEvent = (eventType: keyof typeof PROJECT_EVENTS, data?: any) => {
  const event = new CustomEvent(PROJECT_EVENTS[eventType], { detail: data });
  window.dispatchEvent(event);
};

export const dispatchUserEvent = (eventType: keyof typeof USER_EVENTS, data?: any) => {
  const event = new CustomEvent(USER_EVENTS[eventType], { detail: data });
  window.dispatchEvent(event);
};

// Helper functions to listen to events
export const addProjectEventListener = (
  eventType: keyof typeof PROJECT_EVENTS, 
  callback: (data?: any) => void
) => {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener(PROJECT_EVENTS[eventType], handler as EventListener);
  return () => window.removeEventListener(PROJECT_EVENTS[eventType], handler as EventListener);
};

export const addUserEventListener = (
  eventType: keyof typeof USER_EVENTS, 
  callback: (data?: any) => void
) => {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener(USER_EVENTS[eventType], handler as EventListener);
  return () => window.removeEventListener(USER_EVENTS[eventType], handler as EventListener);
};
