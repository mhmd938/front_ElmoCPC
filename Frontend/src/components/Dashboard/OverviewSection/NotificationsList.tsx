// src/pages/Dashboard/components/OverviewSection/NotificationsList.tsx
import { Bell, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "error";
  date: string;
  read: boolean;
}

interface NotificationsListProps {
  notifications: Notification[];
  showAll?: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return CheckCircle;
    case "warning":
      return AlertCircle;
    case "info":
      return Bell;
    case "error":
      return AlertTriangle;
    default:
      return Bell;
  }
};

const NotificationsList = ({ notifications, showAll = false }: NotificationsListProps) => {
  return (
    <section className="stack" aria-labelledby="notifications-title">
      <div className="row">
        <span className="stat-icon is-yellow" aria-hidden="true">
          <Bell className="icon" />
        </span>
        <h2 className="card-title" id="notifications-title">
          {showAll ? "اطلاعیه‌ها" : "آخرین اطلاعیه‌ها"}
        </h2>
      </div>

      {notifications.length === 0 ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            <Bell className="icon-lg" />
          </span>
          <p className="empty-text">اطلاعیه‌ای برای نمایش وجود ندارد</p>
        </div>
      ) : (
        <div className="list">
          {(showAll ? notifications : notifications.slice(0, 3)).map((notification) => {
            const Icon = getNotificationIcon(notification.type);

            return (
              <div className="list-row" key={notification.id}>
                <span className="stat-icon is-yellow" aria-hidden="true">
                  <Icon className="icon" />
                </span>
                <div className="list-main">
                  <span className="list-title">{notification.title}</span>
                  <span className="list-meta">{notification.message}</span>
                </div>
                <div className="list-actions">
                  {!notification.read && (
                    <span className="badge badge-warning">جدید</span>
                  )}
                  <span className="list-meta">{notification.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default NotificationsList;
