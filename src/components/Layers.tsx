// Pages opened on top of a screen: a report, a user (for admins), a report of that user, and so on.
// Each one adds a browser history entry, so the phone's back button closes the top one.
// Each page also has a "Nazad na …" button at the top, named after the page or screen under it.
// The pages under the top one stay loaded (only hidden), so going back keeps where they were.

import { useEffect, useRef, useState } from 'react';
import type { AdminUser, OdorReport, Point, PublicReport, Language } from '@odormap/common';
import { TEXTS } from '../texts';
import { ReportDetails } from './ReportDetails';
import { UserPage } from './UserDetails';

export type Layer =
  | {
      kind: 'report';
      report: PublicReport | OdorReport;
      areaName: string;
      /** Set when it is known better than from the report (an admin looking at someone's reports). */
      mine?: boolean;
    }
  | { kind: 'user'; userId: string };

/** The screens that open pages on top of them. */
export type BaseScreen = 'map' | 'reports' | 'allReports' | 'users';

export type Layers = ReturnType<typeof useLayers>;

export function useLayers() {
  const [layers, setLayers] = useState<Layer[]>([]);
  // Where each page was scrolled to when the next one was opened over it.
  const scrolls = useRef<number[]>([]);
  const depth = useRef(0);

  useEffect(() => {
    const onBack = () => setLayers((open) => open.slice(0, -1));
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, []);

  // A new page starts at the top; going back returns to where the page under it was.
  useEffect(() => {
    if (layers.length > depth.current) window.scrollTo(0, 0);
    else window.scrollTo(0, scrolls.current.pop() ?? 0);
    depth.current = layers.length;
  }, [layers.length]);

  return {
    layers,
    open(layer: Layer) {
      scrolls.current.push(window.scrollY);
      window.history.pushState(window.history.state, '');
      setLayers((open) => [...open, layer]);
    },
    /** The "Nazad na …" button does the same as the phone's back button. */
    back() {
      window.history.back();
    },
    /** Closes every page at once, e.g. to show a place on the map under them. */
    closeAll() {
      scrolls.current = [];
      setLayers([]);
    },
  };
}

type Props = {
  language: Language;
  base: BaseScreen;
  layers: Layers;
  currentUserId: string;
  onShowOnMap: (point: Point) => void;
};

/** Every open page; only the top one is shown. */
export function LayerStack({ language, base, layers, currentUserId, onShowOnMap }: Props) {
  const t = TEXTS[language];
  const open = layers.layers;
  const backLabels = {
    map: t.backToMap,
    reports: t.backToReports,
    allReports: t.backToAllReports,
    users: t.backToUsers,
    report: t.backToReport,
    user: t.backToUser,
  };

  return open.map((layer, i) => {
    const under = i === 0 ? base : open[i - 1]!.kind;
    return (
      <div key={i} className="screen-part" hidden={i !== open.length - 1}>
        <button className="back-button" onClick={layers.back}>
          ‹ {backLabels[under]}
        </button>
        {layer.kind === 'report' ? (
          <ReportDetails
            language={language}
            report={layer.report}
            areaName={layer.areaName}
            mine={layer.mine}
            // No button for what "Nazad na …" already goes back to.
            onShowOnMap={under === 'map' ? undefined : onShowOnMap}
            onOpenUser={under === 'user' ? undefined : (userId) => layers.open({ kind: 'user', userId })}
          />
        ) : (
          <UserPage
            language={language}
            userId={layer.userId}
            currentUserId={currentUserId}
            onDeleted={layers.back}
            onOpenReport={(report, areaName, user) =>
              layers.open({
                kind: 'report',
                report: withAuthor(report, user),
                areaName,
                mine: user.id === currentUserId,
              })
            }
          />
        )}
      </div>
    );
  });
}

/** A user's report shown like any report opened by an admin: with the user on top. */
function withAuthor(report: OdorReport, user: AdminUser) {
  return { ...report, author: { id: user.id, displayName: user.displayName, email: user.email } };
}
