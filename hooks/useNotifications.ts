import { useEffect, useState } from "react";

export type NotificationType = "order" | "ORDER_CANCELLED" | "order_cancelled" | "user" | "address" | "system";

export type Notification = {
  _id: string;
  title: string;
  message: string;
  type?: NotificationType;
  isRead: boolean;
  orderId?: any;
  userId?: any;
  createdAt: string;
};

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        console.log("Notification fetch failed");
      }
    } catch (error) {
      console.log("Notification Error:", error);
      // DO NOT SHOW TOAST HERE
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return { notifications, setNotifications };
}
