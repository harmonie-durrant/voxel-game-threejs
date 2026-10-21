type Notification = {
    type: "advancement" | "error";
    message: string;
    showFor: number;
    _fadeTimeout?: number;
    element?: HTMLElement;
};

export class Toast {
    notifications: Notification[] = [];

    notificationsContainer: HTMLElement | null = null;

    styles: { [key: string]: string } = {};

    constructor() {
        this.notifications = [];
        this.notificationsContainer = document.getElementById("notifications-container");

        this.styles = {
            notification:
                "flex items-center justify-between p-4 mb-4 rounded-md shadow-[0_0.125rem_0.25rem_rgba(0,0,0,0.075)]",
            error: "bg-[#f8d7da] text-[#721c24]",
            advancement: "bg-[#d4edda] text-[#155724]",
        };
    }

    addNotification(notification: Notification) {
        if (!this.notificationsContainer) {
            this.notificationsContainer = document.getElementById("notifications-container");
        }
        this.notifications.push(notification);
        this.renderNotifications();
        if (!notification._fadeTimeout) {
            notification._fadeTimeout = setTimeout(() => {
                if (notification.element) {
                    // make notification move up and down smoothly
                    notification.element.classList.add(
                        "transition-opacity",
                        "duration-2000",
                        "ease-[ease]",
                        "opacity-0",
                    );
                }
                setTimeout(() => {
                    const idx = this.notifications.indexOf(notification);
                    if (idx !== -1) {
                        if (notification.element) {
                            notification.element.classList.add("hidden");
                        }
                        this.notifications.splice(idx, 1);
                    }
                }, 2000);
            }, notification.showFor);
        }
    }

    renderNotifications() {
        if (!this.notificationsContainer) {
            console.error("Notifications container not found");
            return;
        }
        this.notificationsContainer.innerHTML = "";
        this.notifications.forEach((notification) => {
            if (this.notificationsContainer === null) return;
            const notificationElement = document.createElement("div");
            notificationElement.className = `${this.styles.notification} ${this.styles[notification.type || "warning"] ?? ""}`;
            notificationElement.innerText = notification.message;
            this.notificationsContainer.appendChild(notificationElement);
            notification.element = notificationElement;
        });
    }
}
