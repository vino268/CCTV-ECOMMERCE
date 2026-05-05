import { useEffect, useState, useCallback } from "react";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        cache: 'no-store',
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Polling error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll every 10 seconds (5 might be too frequent for some servers, 10 is safer)
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, loading, refetch: fetchNotifications };
}
