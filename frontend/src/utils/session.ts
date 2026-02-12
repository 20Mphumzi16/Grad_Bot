
// Custom event name for session expiration
export const SESSION_EXPIRED_EVENT = 'session-expired';

export const triggerSessionExpired = () => {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};
