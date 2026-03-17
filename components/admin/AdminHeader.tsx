'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  Bell,
  LogOut,
  Search,
  ShoppingCart,
  UserPlus,
  XCircle,
  X,
  User,
  Settings,
  KeyRound,
  Activity,
  HelpCircle,
  Trash2,
} from 'lucide-react'

type Notification = {
  _id: string
  type: string
  message: string
  orderId: string
  isRead: boolean
  createdAt: string
}

type AdminHeaderProps = {
  onLogout: () => void
  onMenuClick: () => void
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const notifIcon: Record<string, typeof Bell> = {
  order: ShoppingCart,
  user: UserPlus,
  cancel: XCircle,
  delivery: ShoppingCart,
  system: Bell,
}

export default function AdminHeader({ onLogout, onMenuClick }: AdminHeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    const load = () =>
      fetch('/api/admin/notifications')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setNotifications(data)
        })
        .catch(() => {})

    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDeleteOne = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id))
      }
    } catch {
      // silent
    }
  }

  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { method: 'DELETE' })
      if (res.ok) {
        setNotifications([])
      }
    } catch {
      // silent
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { method: 'PUT' })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch {
      // silent
    }
  }

  const handleLogout = () => {
    setAvatarOpen(false)
    onLogout()
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const notifLink: Record<string, string> = {
    order: '/admin/orders',
    cancel: '/admin/orders',
    delivery: '/admin/orders',
    user: '/admin/customers',
    system: '/admin/dashboard',
  }

  const menuItems = [
    { href: '/admin/profile', label: 'My Profile', icon: User },
    { href: '/admin/account', label: 'Account Settings', icon: Settings },
    { href: '/admin/change-password', label: 'Change Password', icon: KeyRound },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    { href: '/admin/activity', label: 'Activity Log', icon: Activity },
    { href: '/admin/help', label: 'Help / Support', icon: HelpCircle },
  ]

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
        {/* Left — Breadcrumb-style title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50/80 text-gray-600 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-400">Management Console</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          {/* Notification Bell */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setBellOpen((v) => !v)
                setAvatarOpen(false)
                if (!bellOpen && unreadCount > 0) handleMarkAllRead()
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50/80 text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon = notifIcon[n.type] || Bell
                      const href = notifLink[n.type] || '/admin/dashboard'
                      return (
                        <div
                          key={n._id}
                          className={`flex items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 ${
                            !n.isRead ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <Link href={href} onClick={() => setBellOpen(false)} className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{n.message}</p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {n.orderId && (
                                <span className="mr-2 font-medium text-gray-500">{n.orderId}</span>
                              )}
                              {timeAgo(n.createdAt)}
                            </p>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(n._id)}
                            className="mt-0.5 flex-shrink-0 rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                            aria-label="Delete notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="border-t px-4 py-2">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setBellOpen(false)}
                      className="block text-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View All Notifications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avatar + Profile Dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              type="button"
              onClick={() => {
                setAvatarOpen((v) => !v)
                setBellOpen(false)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-xs font-bold text-white transition-all duration-200 hover:shadow-md hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              A
            </button>

            {avatarOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                {/* Admin info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500 truncate">Administrator</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-gray-400" />
                        {item.label}
                        {item.label === 'Notifications' && unreadCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </header>
  );
}
