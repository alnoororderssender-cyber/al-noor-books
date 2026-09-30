import { Truck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

/** Text comes from the backend (Admin > Announcement). */
export default function AnnouncementBar() {
  const { settings } = useSettings();
  return (
    <div className="bg-navy text-white" role="region" aria-label="Announcement">
      <div className="page flex min-h-9 items-center justify-center gap-2.5 py-2 text-center text-[11px] font-medium uppercase tracking-wider sm:text-xs">
        {settings?.announcement ? (
          <>
            <Truck size={16} strokeWidth={1.6} className="hidden shrink-0 sm:block" aria-hidden="true" />
            <span>{settings.announcement}</span>
          </>
        ) : (
          <span aria-hidden="true">&nbsp;</span>
        )}
      </div>
    </div>
  );
}
