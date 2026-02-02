// Advanced Analytics Tracker
// Comprehensive event tracking for funnel, cohort, and heatmap analytics

import { v4 as uuidv4 } from 'uuid';

// Session management
let sessionId: string | null = null;
let sessionStartTime: number | null = null;

// Get or create session ID
function getSessionId(): string {
    if (typeof window === 'undefined') return '';

    if (!sessionId) {
        // Check localStorage for existing session
        const stored = localStorage.getItem('analytics_session_id');
        const storedTime = localStorage.getItem('analytics_session_start');

        // Session expires after 30 minutes of inactivity
        if (stored && storedTime) {
            const elapsed = Date.now() - parseInt(storedTime);
            if (elapsed < 30 * 60 * 1000) {
                sessionId = stored;
                sessionStartTime = parseInt(storedTime);
            }
        }

        // Create new session if needed
        if (!sessionId) {
            sessionId = uuidv4();
            sessionStartTime = Date.now();
            localStorage.setItem('analytics_session_id', sessionId);
            localStorage.setItem('analytics_session_start', sessionStartTime.toString());

            // Track session start
            trackSessionStart();
        }
    }

    return sessionId;
}

// Get device type
function getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

// Get browser name
function getBrowserName(): string {
    if (typeof window === 'undefined') return 'unknown';

    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    return 'Other';
}

// Track session start
async function trackSessionStart() {
    if (typeof window === 'undefined') return;

    try {
        await fetch('/api/analytics/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: getSessionId(),
                device: getDeviceType(),
                browser: getBrowserName(),
                referrer: document.referrer || null,
                landingPage: window.location.pathname,
            }),
        });
    } catch (error) {
        console.error('Failed to track session start:', error);
    }
}

// Core event tracking function
export async function trackEvent(
    eventType: string,
    eventData?: Record<string, any>
): Promise<void> {
    if (typeof window === 'undefined') return;

    const payload = {
        sessionId: getSessionId(),
        eventType,
        eventData: eventData || {},
        page: window.location.pathname,
        referrer: document.referrer || null,
        timestamp: new Date().toISOString(),
    };

    try {
        // Fire and forget - don't block UI
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true, // Ensures request completes even if page unloads
        }).catch(err => console.error('Analytics tracking failed:', err));
    } catch (error) {
        console.error('Failed to track event:', error);
    }
}

// Track page view
export function trackPageView(page?: string) {
    trackEvent('PAGE_VIEW', {
        page: page || window.location.pathname,
        title: document.title,
    });
}

// Track product view
export function trackProductView(product: {
    id: string;
    name: string;
    price: number;
    category?: string;
}) {
    trackEvent('VIEW_PRODUCT', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        category: product.category,
    });
}

// Track add to cart
export function trackAddToCartEvent(product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    colorId?: string;
    sizeId?: string;
}) {
    trackEvent('ADD_TO_CART', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: product.quantity,
        colorId: product.colorId,
        sizeId: product.sizeId,
    });
}

// Track remove from cart
export function trackRemoveFromCart(product: {
    id: string;
    name: string;
}) {
    trackEvent('REMOVE_FROM_CART', {
        productId: product.id,
        productName: product.name,
    });
}

// Track begin checkout
export function trackBeginCheckoutEvent(cart: {
    items: any[];
    total: number;
}) {
    trackEvent('BEGIN_CHECKOUT', {
        itemCount: cart.items.length,
        totalValue: cart.total,
        items: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
        })),
    });
}

// Track purchase complete
export function trackPurchaseEvent(order: {
    orderId: string;
    total: number;
    items: any[];
}) {
    trackEvent('PURCHASE', {
        orderId: order.orderId,
        total: order.total,
        itemCount: order.items.length,
        items: order.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
        })),
    });
}

// Track search
export function trackSearchEvent(searchTerm: string, resultsCount: number) {
    trackEvent('SEARCH', {
        query: searchTerm,
        resultsCount,
    });
}

// Track user signup
export function trackSignupEvent() {
    trackEvent('SIGNUP', {
        method: 'email',
    });
}

// Track user login
export function trackLoginEvent() {
    trackEvent('LOGIN', {
        method: 'email',
    });
}

// Track click for heatmap
export function trackClick(event: MouseEvent, elementId?: string) {
    if (typeof window === 'undefined') return;

    const xPercent = (event.clientX / window.innerWidth) * 100;
    const yPercent = (event.clientY / window.innerHeight) * 100;

    // Send to heatmap endpoint
    fetch('/api/analytics/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            page: window.location.pathname,
            elementId,
            xPercent,
            yPercent,
            sessionId: getSessionId(),
            device: getDeviceType(),
        }),
        keepalive: true,
    }).catch(err => console.error('Heatmap tracking failed:', err));
}

// Initialize analytics tracking
export function initAnalytics() {
    if (typeof window === 'undefined') return;

    // Ensure session is initialized
    getSessionId();

    // Track page view on load
    trackPageView();

    // Track clicks for heatmap (sample 10% of clicks to reduce volume)
    document.addEventListener('click', (e) => {
        if (Math.random() < 0.1) { // 10% sampling
            const target = e.target as HTMLElement;
            trackClick(e, target.id || undefined);
        }
    });

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
        if (sessionId) {
            navigator.sendBeacon('/api/analytics/session-end', JSON.stringify({
                sessionId,
            }));
        }
    });
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnalytics);
    } else {
        initAnalytics();
    }
}
