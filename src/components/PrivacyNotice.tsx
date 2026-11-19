// The privacy notice shown at sign-up.
//
// TODO before launch: name who is responsible for the data (a person or an
// association) and how to contact them, in RESPONSIBLE below.

import type { Language } from '@odormap/common';

const RESPONSIBLE = {
  sr: '[ime odgovorne osobe ili udruženja, kontakt email]',
  hu: '[a felelős személy vagy egyesület neve, kapcsolattartó e-mail]',
};

export function PrivacyNotice({ language }: { language: Language }) {
  return language === 'hu' ? <Hungarian /> : <Serbian />;
}

function Serbian() {
  return (
    <div className="privacy">
      <p>
        OdorMap prikuplja prijave neprijatnih mirisa da bi se videlo gde i kada se javljaju i odakle dolaze.
      </p>
      <p>Čuvamo:</p>
      <ul>
        <li>tvoj email i ime, ako napraviš nalog (gost nema ni jedno ni drugo);</li>
        <li>za svaku prijavu: tačnu lokaciju, vreme, jačinu i vrstu mirisa, komentar i vremenske prilike u tom trenutku.</li>
      </ul>
      <p>
        Drugi korisnici vide prijave bez tvog imena i komentara, a lokacija je zaokružena na oko 100 m. Tačnu lokaciju vidiš
        samo ti i administratori, i koristi se za analizu izvora mirisa.
      </p>
      <p>
        Nalog možeš da obrišeš u svakom trenutku, pod „Moj nalog”. Tvoje prijave tada ostaju na mapi, ali bez ikakve veze sa
        tobom i bez komentara.
      </p>
      <p>Za podatke je odgovoran: {RESPONSIBLE.sr}.</p>
    </div>
  );
}

function Hungarian() {
  return (
    <div className="privacy">
      <p>
        Az OdorMap a kellemetlen szagokról szóló bejelentéseket gyűjti, hogy látható legyen, hol és mikor jelentkeznek, és
        honnan erednek.
      </p>
      <p>Amit tárolunk:</p>
      <ul>
        <li>az e-mail-címed és a neved, ha fiókot hozol létre (vendégként egyiket sem);</li>
        <li>minden bejelentésnél: a pontos helyet, az időt, a szag erősségét és fajtáját, a megjegyzést és az akkori időjárást.</li>
      </ul>
      <p>
        A többi felhasználó a bejelentéseket a neved és a megjegyzés nélkül látja, a hely pedig kb. 100 m-re kerekítve
        jelenik meg. A pontos helyet csak te és az adminisztrátorok látjátok; a szagforrások elemzéséhez használjuk.
      </p>
      <p>
        A fiókodat bármikor törölheted a „Fiókom” menüpontban. A bejelentéseid ekkor a térképen maradnak, de nem köthetők
        hozzád, és megjegyzés nélkül.
      </p>
      <p>Az adatokért felelős: {RESPONSIBLE.hu}.</p>
    </div>
  );
}
