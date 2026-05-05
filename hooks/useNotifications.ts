import { useEffect, useState } from "react";

export type Notification = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  orderId?: any;
  userId?: any;
  createdAt?: string;
};

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  return { notifications, setNotifications };
}
