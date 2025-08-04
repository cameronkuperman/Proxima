/**
 * Session Management with Inactivity Timeout and Remember Me
 * 
 * Features:
 * - 4 hour inactivity timeout (resets on any activity)
 * - 7 day absolute session timeout
 * - 30 day "Remember Me" option
 * - Automatic logout on timeout
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

// Configuration
const INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const ABSOLUTE_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
const REMEMBER_ME_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days

// Storage keys
const LAST_ACTIVITY_KEY = 'proxima_last_activity';
const SESSION_START_KEY = 'proxima_session_start';
const REMEMBER_ME_KEY = 'proxima_remember_me';

export class SessionManager {
  private static instance: SessionManager;
  private activityTimer: NodeJS.Timeout | null = null;
  private absoluteTimer: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Initialize activity tracking
    this.setupActivityListeners();
    this.checkExistingSession();
  }
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  /**
   * Initialize session with remember me option
   */
  async initializeSession(rememberMe: boolean = false) {
    logger.debug('SessionManager: Initializing session', { rememberMe });
    
    // Store remember me preference
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    }
    
    // Set session start time
    const now = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_START_KEY, now.toString());
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    }
    
    // Start timers
    this.startInactivityTimer();
    this.startAbsoluteTimer(rememberMe);
    
    // Update activity on initialization
    this.updateActivity();
  }
  
  /**
   * Check if user has valid existing session on page load
   */
  private async checkExistingSession() {
    if (typeof window === 'undefined') return;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      this.clearSessionData();
      return;
    }
    
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    
    if (!lastActivity || !sessionStart) {
      // No session data, initialize new session
      this.initializeSession(rememberMe);
      return;
    }
    
    const now = Date.now();
    const lastActivityTime = parseInt(lastActivity);
    const sessionStartTime = parseInt(sessionStart);
    
    // Check inactivity timeout
    if (now - lastActivityTime > INACTIVITY_TIMEOUT) {
      logger.info('SessionManager: Session expired due to inactivity');
      await this.logout('Your session expired due to inactivity');
      return;
    }
    
    // Check absolute timeout
    const maxTimeout = rememberMe ? REMEMBER_ME_TIMEOUT : ABSOLUTE_TIMEOUT;
    if (now - sessionStartTime > maxTimeout) {
      logger.info('SessionManager: Session expired (absolute timeout)');
      await this.logout('Your session has expired. Please sign in again');
      return;
    }
    
    // Valid session, restart timers
    this.startInactivityTimer();
    this.startAbsoluteTimer(rememberMe);
  }
  
  /**
   * Update last activity timestamp
   */
  updateActivity() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
    
    // Restart inactivity timer
    this.startInactivityTimer();
  }
  
  /**
   * Start inactivity timer
   */
  private startInactivityTimer() {
    // Clear existing timer
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    // Set new timer
    this.activityTimer = setTimeout(async () => {
      logger.info('SessionManager: Inactivity timeout reached');
      await this.logout('Your session expired due to inactivity');
    }, INACTIVITY_TIMEOUT);
  }
  
  /**
   * Start absolute session timer
   */
  private startAbsoluteTimer(rememberMe: boolean) {
    // Clear existing timer
    if (this.absoluteTimer) {
      clearTimeout(this.absoluteTimer);
    }
    
    const timeout = rememberMe ? REMEMBER_ME_TIMEOUT : ABSOLUTE_TIMEOUT;
    
    // Calculate remaining time
    if (typeof window !== 'undefined') {
      const sessionStart = localStorage.getItem(SESSION_START_KEY);
      if (sessionStart) {
        const elapsed = Date.now() - parseInt(sessionStart);
        const remaining = timeout - elapsed;
        
        if (remaining > 0) {
          this.absoluteTimer = setTimeout(async () => {
            logger.info('SessionManager: Absolute timeout reached');
            await this.logout('Your session has expired. Please sign in again');
          }, remaining);
        }
      }
    }
  }
  
  /**
   * Setup activity listeners
   */
  private setupActivityListeners() {
    if (typeof window === 'undefined') return;
    
    // User activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Debounce activity updates (max once per minute)
    let lastUpdate = 0;
    const updateDebounced = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // 1 minute
        lastUpdate = now;
        this.updateActivity();
      }
    };
    
    events.forEach(event => {
      window.addEventListener(event, updateDebounced, { passive: true });
    });
    
    // Also update on navigation
    window.addEventListener('popstate', updateDebounced);
  }
  
  /**
   * Logout and clear session data
   */
  async logout(message?: string) {
    logger.debug('SessionManager: Logging out', { message });
    
    // Clear timers
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.absoluteTimer) {
      clearTimeout(this.absoluteTimer);
      this.absoluteTimer = null;
    }
    
    // Clear session data
    this.clearSessionData();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Redirect to login with message
    if (typeof window !== 'undefined') {
      const params = message ? `?message=${encodeURIComponent(message)}` : '';
      window.location.href = `/login${params}`;
    }
  }
  
  /**
   * Clear all session data from localStorage
   */
  private clearSessionData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  }
  
  /**
   * Get session info for debugging
   */
  getSessionInfo() {
    if (typeof window === 'undefined') return null;
    
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    
    if (!lastActivity || !sessionStart) return null;
    
    const now = Date.now();
    const lastActivityTime = parseInt(lastActivity);
    const sessionStartTime = parseInt(sessionStart);
    
    return {
      rememberMe,
      inactiveFor: Math.floor((now - lastActivityTime) / 1000 / 60), // minutes
      sessionAge: Math.floor((now - sessionStartTime) / 1000 / 60 / 60), // hours
      remainingInactivity: Math.floor((INACTIVITY_TIMEOUT - (now - lastActivityTime)) / 1000 / 60), // minutes
      remainingAbsolute: Math.floor(((rememberMe ? REMEMBER_ME_TIMEOUT : ABSOLUTE_TIMEOUT) - (now - sessionStartTime)) / 1000 / 60 / 60), // hours
    };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();