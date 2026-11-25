// "What is OdorMap?" at the top of the sign-in screen, with a fold-out on how to use it.

import type { Language } from '@odormap/common';

const ABOUT = {
  sr: {
    title: 'Šta je OdorMap?',
    intro: 'OdorMap je aplikacija u kojoj korisnici prijavljuju neprijatne mirise u svom kraju.',
    why: 'Svaka prijava čuva mesto, vreme, jačinu mirisa i meteorološke prilike u tom trenutku. Što više prijava, to preciznije možemo da otkrijemo izvor mirisa.',
    howTitle: 'Kako se koristi?',
    steps: [
      'Kada osetiš neprijatan miris, otvori aplikaciju i dozvoli lokaciju.',
      'Izaberi jačinu mirisa. Vrstu mirisa i komentar možeš da dodaš ako želiš.',
      'Pošalji prijavu. Vreme i meteorološke prilike se dodaju sami.',
      'Prijave svih korisnika vidiš u meniju ☰, pod „Prijave”.',
    ],
    tip: 'Prijavljuj samo miris koji osećaš sada, ne onaj od ranije.',
  },
  hu: {
    title: 'Mi az OdorMap?',
    intro:
      'Az OdorMap egy alkalmazás, amelyben a felhasználók bejelenthetik a környékükön érzett kellemetlen szagokat.',
    why: 'Minden bejelentés tárolja a helyet, az időpontot, a szag erősségét és az akkori időjárási adatokat. Minél több a bejelentés, annál pontosabban meghatározható a szag forrása.',
    howTitle: 'Hogyan használd?',
    steps: [
      'Ha kellemetlen szagot érzel, nyisd meg az alkalmazást, és engedélyezd a helymeghatározást.',
      'Válaszd ki a szag erősségét. A szag fajtáját és megjegyzést is hozzáadhatsz, ha szeretnél.',
      'Küldd el a bejelentést. Az időpontot és az időjárási adatokat az alkalmazás magától hozzáadja.',
      'Mindenki bejelentését a ☰ menüben, a „Bejelentések” alatt látod.',
    ],
    tip: 'Csak azt a szagot jelentsd, amit most érzel, ne a korábbiakat.',
  },
};

export function About({ language }: { language: Language }) {
  const a = ABOUT[language];
  return (
    <section className="card about">
      <h2>{a.title}</h2>
      <p>{a.intro}</p>
      <p>{a.why}</p>
      <details>
        <summary>{a.howTitle}</summary>
        <ol>
          {a.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="muted small">{a.tip}</p>
      </details>
    </section>
  );
}
