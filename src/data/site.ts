// Facts from plan.md §2 only. No dates, no second phone number.
export const contact = {
  phone: '+91 92278 66635',
  phoneHref: 'tel:+919227866635',
  email: 'pksompura35@gmail.com',
  instagram: '@p.k_sompura',
  instagramHref: 'https://instagram.com/p.k_sompura',
};

export type NavKey = 'stone' | 'cnc' | 'fero' | 'register' | 'contact';

export const nav: { key: NavKey; label: string; href: string }[] = [
  { key: 'stone', label: 'Stone Works', href: '/#stone-works' },
  { key: 'cnc', label: 'CNC Works', href: '/#cnc-works' },
  { key: 'fero', label: 'Fero Works', href: '/#fero-works' },
  { key: 'register', label: 'Temple Register', href: '/projects' },
  { key: 'contact', label: 'Contact', href: '/contact' },
];
