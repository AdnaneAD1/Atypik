'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { useAuth } from '@/lib/auth/auth-context';
import { nativeHaptics } from '@/lib/mobile/haptics';

/* =====================================================
   Menu du bas mobile — style maquette Atypik
   Bordure pointillée « route », icônes à remplissage rose,
   taxi animé qui roule jusqu'à l'onglet actif, badges.
   Les styles vivent dans globals.css (.tabbar, .tab, .tab-taxi…)
   ===================================================== */

type IconKey =
  | 'home' | 'route' | 'calendar' | 'chat' | 'profile'
  | 'users' | 'pin' | 'car' | 'shield';

const TAB_ICONS: Record<IconKey, React.ReactNode> = {
  home: (
    <>
      <path className="f" d="M3.5 11 12 4l8.5 7v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M10 21v-5.5h4V21" />
    </>
  ),
  route: (
    <>
      <circle className="f" cx="6" cy="18" r="2.6" />
      <circle className="f" cx="18" cy="6" r="2.6" />
      <path d="M6 15.4C6 10 18 14 18 8.6" strokeDasharray="0.1 3.4" />
    </>
  ),
  calendar: (
    <>
      <rect className="f" x="3.5" y="5.5" width="17" height="15" rx="3" />
      <path d="M3.5 10.5h17M8 3.5v4M16 3.5v4" />
    </>
  ),
  chat: (
    <path className="f" d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v9a1.5 1.5 0 0 1-1.5 1.5h-8.5L6 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5Z" />
  ),
  profile: (
    <>
      <circle className="f" cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.6-4 3.6-6 7.5-6s6.9 2 7.5 6" />
    </>
  ),
  users: (
    <>
      <circle className="f" cx="9" cy="8" r="3.4" />
      <path d="M3.5 20c.5-3.3 2.6-5 5.5-5s5 1.7 5.5 5" />
      <circle className="f" cx="17" cy="9" r="2.6" />
      <path d="M15.2 20c.4-2.6 2-3.9 4.5-3.9 1.3 0 2.3.4 3 1" />
    </>
  ),
  pin: (
    <>
      <path className="f" d="M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  car: (
    <>
      <rect className="f" x="3" y="12" width="18" height="5" rx="2" />
      <path d="M7 12l2.2-4.5h5.6L17 12" />
      <circle cx="8.5" cy="18" r="1.9" />
      <circle cx="15.5" cy="18" r="1.9" />
    </>
  ),
  shield: (
    <>
      <path className="f" d="M12 3.5l7 2.8v5.2c0 4.6-3 7.9-7 9-4-1.1-7-4.4-7-9V6.3Z" />
      <path d="M9 11.8l2.2 2.2 4-4" />
    </>
  ),
};

const TAXI_SVG = (
  <svg viewBox="0 0 40 23">
    <g stroke="#101828" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="14" y="0.8" width="9" height="3.2" rx="1" fill="#101828" />
      <path d="M9 11 L13 5 H27 L31 11 Z" fill="#ffc21a" />
      <rect x="2" y="10" width="36" height="8" rx="3.5" fill="#ffc21a" />
    </g>
    <path d="M13.2 10 L15.6 6.4 H20 V10 Z" fill="#e7f2ff" />
    <path d="M22 6.4 H26.2 L28.6 10 H22 Z" fill="#e7f2ff" />
    <circle cx="36" cy="13.5" r="1.3" fill="#fff6d9" />
    <circle cx="11" cy="19" r="3.4" fill="#101828" />
    <g className="w"><circle cx="11" cy="19" r="1.2" fill="#fff" /><path d="M11 16.8V21.2" stroke="#fff" strokeWidth=".7" /></g>
    <circle cx="29" cy="19" r="3.4" fill="#101828" />
    <g className="w"><circle cx="29" cy="19" r="1.2" fill="#fff" /><path d="M29 16.8V21.2" stroke="#fff" strokeWidth=".7" /></g>
  </svg>
);

interface TabItem {
  href: string;
  label: string;
  icon: IconKey;
  /** Affiche le point live menthe quand une mission/tracking est en cours */
  live?: 'mission' | 'tracking';
  /** Affiche la pastille du nombre de messages non lus */
  badge?: 'messages';
}

const DRIVER_TABS: TabItem[] = [
  { href: '/driver/dashboard', label: 'Accueil', icon: 'home' },
  { href: '/driver/missions', label: 'Missions', icon: 'route', live: 'mission' },
  { href: '/driver/calendar', label: 'Planning', icon: 'calendar' },
  { href: '/driver/messages', label: 'Messages', icon: 'chat', badge: 'messages' },
  { href: '/profile', label: 'Profil', icon: 'profile' },
];

const PARENT_TABS: TabItem[] = [
  { href: '/parent/dashboard', label: 'Accueil', icon: 'home' },
  { href: '/parent/children', label: 'Enfants', icon: 'users' },
  { href: '/parent/calendar', label: 'Planning', icon: 'calendar' },
  { href: '/parent/tracking', label: 'Suivi', icon: 'pin', live: 'tracking' },
  { href: '/parent/messages', label: 'Messages', icon: 'chat', badge: 'messages' },
];

const ADMIN_TABS: TabItem[] = [
  { href: '/admin/dashboard', label: 'Accueil', icon: 'home' },
  { href: '/admin/parents', label: 'Parents', icon: 'users' },
  { href: '/admin/drivers', label: 'Chauffeurs', icon: 'car' },
  { href: '/admin/assignments', label: 'Assignations', icon: 'shield' },
  { href: '/admin/admins', label: 'Admins', icon: 'profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [hasLive, setHasLive] = useState(false);
  const [taxiIndex, setTaxiIndex] = useState(0);
  const [taxiBack, setTaxiBack] = useState(false);
  const [taxiRolling, setTaxiRolling] = useState(false);
  const rollingTimer = useRef<ReturnType<typeof setTimeout>>();

  const tabs = useMemo<TabItem[]>(
    () => (user?.role === 'driver' ? DRIVER_TABS : user?.role === 'parent' ? PARENT_TABS : user?.role === 'admin' ? ADMIN_TABS : []),
    [user?.role]
  );

  const activeIndex = useMemo(
    () => tabs.findIndex((t) => pathname === t.href || pathname.startsWith(`${t.href}/`)),
    [tabs, pathname]
  );

  const hasMessageTab = tabs.some((t) => t.badge === 'messages');
  const liveKind = tabs.find((t) => t.live)?.live;

  // Pastille : nombre total de messages non lus (temps réel)
  useEffect(() => {
    if (!user?.id || !hasMessageTab) return;
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.id)
    );
    return onSnapshot(q, (snap) => {
      let total = 0;
      snap.forEach((d) => {
        const counts = (d.data().unreadCount || {}) as Record<string, number>;
        total += counts[user.id] || 0;
      });
      setUnreadMessages(total);
    });
  }, [user?.id, hasMessageTab]);

  // Point live : mission en cours (chauffeur) ou transport suivi (parent)
  useEffect(() => {
    if (!user?.id || !liveKind) return;
    const q =
      liveKind === 'mission'
        ? query(collection(db, 'activeMissions'), where('driverId', '==', user.id))
        : query(collection(db, 'transports'), where('parentId', '==', user.id));
    return onSnapshot(q, (snap) => {
      const live = snap.docs.some((d) => {
        const status = d.data().status;
        return liveKind === 'mission'
          ? status === 'started' || status === 'in_progress'
          : status === 'in-progress';
      });
      setHasLive(live);
    });
  }, [user?.id, liveKind]);

  // Précharger toutes les pages en arrière-plan pour une navigation instantanée
  useEffect(() => {
    tabs.forEach((t) => router.prefetch(t.href));
  }, [tabs, router]);

  // Le taxi roule vers l'onglet actif (sens inverse si on recule dans la barre)
  useEffect(() => {
    if (activeIndex < 0) return;
    setTaxiIndex((prev) => {
      if (prev !== activeIndex) {
        setTaxiBack(activeIndex < prev);
        setTaxiRolling(true);
        clearTimeout(rollingTimer.current);
        rollingTimer.current = setTimeout(() => setTaxiRolling(false), 520);
      }
      return activeIndex;
    });
  }, [activeIndex]);

  useEffect(() => () => clearTimeout(rollingTimer.current), []);

  if (!user || tabs.length === 0) return null;

  const handleTap = (href: string) => {
    nativeHaptics.light();
    router.push(href);
  };

  return (
    <nav
      className={`tabbar${taxiRolling ? ' go' : ''}`}
      style={{ '--n': tabs.length, '--i': Math.max(taxiIndex, 0) } as React.CSSProperties}
      aria-label="Navigation principale"
    >
      <div className={`tab-taxi${taxiBack ? ' back' : ''}`} aria-hidden="true">
        {TAXI_SVG}
      </div>
      <ul>
        {tabs.map((tab, i) => (
          <li key={tab.href}>
            <button
              type="button"
              className="tab"
              onClick={() => handleTap(tab.href)}
              aria-current={i === activeIndex ? 'page' : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {TAB_ICONS[tab.icon]}
              </svg>
              {tab.label}
              {tab.badge === 'messages' && unreadMessages > 0 && (
                <span className="tab-badge">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                  <span className="sr"> nouveaux</span>
                </span>
              )}
              {tab.live && hasLive && (
                <>
                  <span className="tab-live" />
                  <span className="sr">
                    , {tab.live === 'mission' ? 'une mission en cours' : 'un suivi en cours'}
                  </span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
