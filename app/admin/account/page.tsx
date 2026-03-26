import { redirect } from 'next/navigation';

export default function AdminAccountRedirectPage() {
  redirect('/admin/profile');
}
