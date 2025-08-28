// In-memory session storage for MVP
// In production, replace with Redis or PostgreSQL

class SessionStore {
  constructor() {
    this.sessions = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Clean up every minute
  }

  createSession(sessionId, data) {
    const session = {
      id: sessionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ...data
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { lastActivity: new Date() });
      return session;
    }
    return null;
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  cleanup() {
    const now = new Date();
    const timeout = parseInt(process.env.SESSION_TIMEOUT) || 300000; // 5 minutes default
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(sessionId);
        console.log(`Cleaned up expired session: ${sessionId}`);
      }
    }
  }

  getStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => 
        new Date() - s.lastActivity < 300000
      ).length
    };
  }
}

module.exports = new SessionStore();
