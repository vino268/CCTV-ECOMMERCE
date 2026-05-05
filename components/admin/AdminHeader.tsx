'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import LogoutConfirmModal from '@/components/logout-confirm-modal'
import {
  Bell,
  LogOut,
  Menu,
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
import { buildApiUrl, parseResponseBody } from '@/lib/http-response'
import { getAdminAuthHeaders } from '@/lib/admin-auth'
import { fetchWithAuth } from '@/utils/api'
import { toProfileImageUrl } from '@/lib/profile-image-url'
import { useAdminAuth } from '@/lib/contexts/admin-auth-context'
import useNotifications, { Notification } from '@/hooks/useNotifications'

type AdminHeaderProps = {
  onLogout: () => void
  onMenuOpen?: () => void
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
  ORDER_CANCELLED: XCircle,
  order_cancelled: XCircle,
  user: UserPlus,
  address: User,
  system: Bell,
}

function getOrderLabel(orderId: Notification['orderId']) {
  if (!orderId) return ''
  if (typeof orderId === 'string') return orderId
  return String(orderId.orderId || orderId.orderNumber || orderId._id || '')
}

function toDisplayText(value: unknown) {
  if (typeof value === 'string') return value
  if (value == null) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export default function AdminHeader({ onLogout, onMenuOpen }: AdminHeaderProps) {
  const { notifications, setNotifications } = useNotifications();
  const [bellOpen, setBellOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { admin } = useAdminAuth()

  const getInitial = (name?: string, email?: string) => (name || email || 'A').charAt(0).toUpperCase()

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      if (!target.closest('.notification-menu')) {
        setBellOpen(false)
      }

      if (!target.closest('.profile-menu')) {
        setOpenMenu(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleDeleteOne = async (id: string) => {
    try {
      const res = await fetch(buildApiUrl(`/api/notifications/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id))
      }
    } catch {
      // silent
    }
  }

  const handleClearAll = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/notifications'), {
        method: 'DELETE',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      })
      if (res.ok) {
        setNotifications([])
      }
    } catch {
      // silent
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/notifications/read-all'), {
        method: 'PUT',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch {
      // silent
    }
  }

  const handleLogout = () => {
    setOpenMenu(false)
    setShowLogoutModal(true)
  }

  const handleConfirmLogout = () => {
    setIsLoggingOut(true)
    setShowLogoutModal(false)
    onLogout()
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const notifLink: Record<string, string> = {
    order: '/admin/orders',
    ORDER_CANCELLED: '/admin/orders',
    order_cancelled: '/admin/orders',
    address: '/admin/orders',
    user: '/admin/customers',
    system: '/admin/dashboard',
  }

  const menuItems = [
    { href: '/admin/profile', label: 'My Profile', icon: User },
    { href: '/admin/settings', label: 'Account Settings', icon: Settings },
    { href: '/admin/change-password', label: 'Change Password', icon: KeyRound },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    { href: '/admin/activity', label: 'Activity Log', icon: Activity },
    { href: '/admin/help', label: 'Help / Support', icon: HelpCircle },
  ]

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const adminName = String(admin?.name || admin?.email || 'Admin')
  const adminProfileImage = String(admin?.profileImage || '')
  const adminInitial = getInitial(admin?.name, admin?.email)
  const adminAvatarSrc = toProfileImageUrl(adminProfileImage, admin?.avatarVersion)

  return (
    <header className="mt-0 px-4 pt-2 pb-2 md:px-4 md:py-3 bg-transparent">
      <div className="md:hidden">
        <div className="flex items-center justify-between px-0 py-1">
          <div className="flex items-center gap-2">
            {onMenuOpen && (
              <button
                type="button"
                onClick={onMenuOpen}
                aria-label="Open sidebar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-800">Admin</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative notification-menu">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setBellOpen((v) => !v)
                  setOpenMenu(false)
                  if (!bellOpen && unreadCount > 0) handleMarkAllRead()
                }}
                className="relative inline-flex h-8 w-8 items-center justify-center text-gray-600"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
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

                  <div className="max-h-[65vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const type = n.type ?? 'system'
                        const Icon = notifIcon[type] || Bell
                        const href = notifLink[type] || '/admin/dashboard'
                        const orderLabel = getOrderLabel(n.orderId)
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
                              <p className="text-sm font-semibold text-gray-800">{n.title || 'Notification'}</p>
                              <p className="text-sm text-gray-700">{toDisplayText(n.message)}</p>
                              <p className="mt-0.5 text-xs text-gray-400">
                                {orderLabel && (
                                  <span className="mr-2 font-medium text-gray-500">{orderLabel}</span>
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

            <div className="relative profile-menu">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu((v) => !v)
                  setBellOpen(false)
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white transition ${
                  adminProfileImage
                    ? 'border-2 border-blue-500 bg-white hover:opacity-90'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {adminProfileImage ? (
                  <img
                    src={adminAvatarSrc}
                    alt="admin"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  adminInitial
                )}
              </button>

              {openMenu && (
                <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{adminName}</p>
                    <p className="text-xs text-gray-500 truncate">Administrator</p>
                  </div>

                  <div className="py-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={`${item.href}-${item.label}`}
                          href={item.href}
                          onClick={() => setOpenMenu(false)}
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
        </div>
        <div className="mt-3 text-xs text-gray-500">Today • {today}</div>
      </div>

      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {adminName} 👋</h1>
          <p className="text-sm text-gray-500">Admin Panel</p>
          <p className="text-xs text-gray-400 mt-1">Today: {today}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search admin data..."
              className="h-10 w-64 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none ring-0 transition placeholder:text-gray-400 focus:border-gray-300"
            />
          </div>

          {/* Notification Bell */}
          <div className="relative notification-menu">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setBellOpen((v) => !v)
                setOpenMenu(false)
                if (!bellOpen && unreadCount > 0) handleMarkAllRead()
              }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 max-w-[90vw] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
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
                    notifications.map((n, index) => {
                      const type = n.type ?? 'system'
                      const Icon = notifIcon[type] || Bell
                      const href = notifLink[type] || '/admin/dashboard'
                      const orderLabel = getOrderLabel(n.orderId)
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
                            <p className="text-sm font-semibold text-gray-800">{n.title || 'Notification'}</p>
                            <p className="text-sm text-gray-700">{toDisplayText(n.message)}</p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {orderLabel && (
                                <span className="mr-2 font-medium text-gray-500">{orderLabel}</span>
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
          <div className="relative profile-menu">
            <button
              type="button"
              onClick={() => {
                setOpenMenu((v) => !v)
                setBellOpen(false)
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                adminProfileImage
                  ? 'border-2 border-blue-500 bg-white hover:opacity-90'
                  : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {adminProfileImage ? (
                <img
                  src={adminAvatarSrc}
                  alt="admin"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                adminInitial
              )}
            </button>

            {openMenu && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                {/* Admin info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{adminName}</p>
                  <p className="text-xs text-gray-500 truncate">Administrator</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        onClick={() => setOpenMenu(false)}
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
      </div>

      <LogoutConfirmModal
        open={showLogoutModal}
        isProcessing={isLoggingOut}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isLoggingOut) setShowLogoutModal(false)
        }}
        onConfirm={handleConfirmLogout}
      />
    </header>
  )
}
