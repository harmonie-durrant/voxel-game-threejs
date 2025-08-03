type Notification = {
    type: 'advancement' | 'error',
    message: string,
    showFor: number,
    _fadeTimeout?: number,
    element?: HTMLElement
}

export class Toast {
    notifications: Notification[] = [];

    notificationsContainer: HTMLElement | null = null;

    styles: { [key: string]: string } = {};

    constructor() {
        this.notifications = [];
        this.notificationsContainer = document.getElementById('notifications-container');

        this.styles = {
            notification: "padding: 1rem; margin-bottom: 1rem; border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075); display: flex; align-items: center; justify-content: space-between;",
            error: "background-color: #f8d7da; color: #721c24;",
            advancement: "background-color: #d4edda; color: #155724;",
        };
    }

    addNotification(notification: Notification) {
        if (!this.notificationsContainer) {
            this.notificationsContainer = document.getElementById('notifications-container');
        }
        this.notifications.push(notification);
        this.renderNotifications();
        if (!notification._fadeTimeout) {
            notification._fadeTimeout = setTimeout(() => {
                if (notification.element) {
                    // make notification move up and down smoothly
                    notification.element.style.transition = 'opacity 2s';
                    notification.element.style.opacity = '0';
                }
                setTimeout(() => {
                    const idx = this.notifications.indexOf(notification);
                    if (idx !== -1) {
                        if (notification.element) {
                            notification.element.style.display = 'none';
                        }
                        this.notifications.splice(idx, 1);
                    }
                }, 2000);
            }, notification.showFor);
        }
    }

    renderNotifications() {
        if (!this.notificationsContainer) {
            console.error('Notifications container not found');
            return;
        }
        this.notificationsContainer.innerHTML = '';
        this.notifications.forEach((notification) => {
            if (this.notificationsContainer === null) return;
            const notificationElement = document.createElement('div');
            notificationElement.style.cssText = this.styles.notification + this.styles[notification.type || 'warning'];
            notificationElement.innerText = notification.message;
            this.notificationsContainer.appendChild(notificationElement);
            notification.element = notificationElement;
        });
    }
}