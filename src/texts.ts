// Every text on screen, in Serbian (Latin script) and Hungarian.
// Names of odor kinds and strengths come from LABELS in @odormap/common.
//
// Use: const t = TEXTS[language];  then  t.sendReport
//
// These translations still need checking by native speakers.

import type { Language } from '@odormap/common';

export const TEXTS = {
  sr: {
    tagline: 'Prijavi neprijatan miris u svom kraju.',
    logOut: 'Odjavi se',
    myAccount: 'Moj nalog',
    home: 'Početna',
    reportTab: 'Prijavi neprijatan miris',
    menu: 'Meni',
    guestNotice: 'Koristiš aplikaciju kao gost.',
    createAccount: 'Napravi nalog da sačuvaš prijave',

    // Sign-in screen
    privacyTitle: 'Obaveštenje o privatnosti',
    privacyIntro: 'Pre nego što nastaviš, pročitaj kako koristimo tvoje podatke.',
    acceptAndContinue: 'Prihvatam i nastavljam',
    continueAsGuest: 'Nastavi bez naloga',
    or: 'ili',
    email: 'Email',
    password: 'Lozinka',
    name: 'Ime',
    logIn: 'Prijavi se',
    register: 'Napravi nalog',
    haveAccount: 'Već imaš nalog? Prijavi se',
    noAccount: 'Nemaš nalog? Napravi ga',
    wrongLogin: 'Pogrešan email ili lozinka.',
    emailTaken: 'Nalog sa ovim emailom već postoji.',
    passwordTooShort: 'Lozinka mora imati bar 8 znakova.',
    somethingWrong: 'Nešto nije u redu. Pokušaj ponovo.',

    // Report form
    location: 'Lokacija',
    locating: 'Tražim tvoju lokaciju…',
    locationFound: 'Lokacija pronađena',
    locationOff: 'Uključi lokaciju (GPS) na telefonu, pa pritisni „Pokušaj ponovo”.',
    locationDenied: 'Pregledač ne dozvoljava pristup lokaciji. Dozvoli ga u podešavanjima pregledača, pa pokušaj ponovo.',
    unknownArea: 'Nepoznato područje',
    tryAgain: 'Pokušaj ponovo',
    howStrong: 'Jačina neprijatnog mirisa',
    odorKindOptional: 'Vrsta neprijatnog mirisa (nije obavezno)',
    describeOther: 'Opiši neprijatan miris',
    removeOdorKind: 'Ukloni vrstu mirisa',
    commentOptional: 'Komentar (nije obavezno)',
    commentHint: 'Vidiš ga samo ti.',
    sendReport: 'Pošalji prijavu',
    sending: 'Šaljem…',
    tooMany: 'Poslao/la si mnogo prijava u poslednjih sat vremena. Pokušaj kasnije.',
    thanks: 'Hvala! Prijava je poslata.',
    reportAgain: 'Nova prijava',

    // Account screen
    accountType: 'Vrsta naloga',
    guestAccount: 'Gost',
    fullAccount: 'Nalog',
    memberSince: 'Član od',
    deleteAccount: 'Obriši nalog',
    deleteWarning: 'Tvoj nalog se briše. Prijave ostaju na mapi, ali bez veze sa tobom i bez komentara. Ovo ne može da se poništi.',
    deleteAreYouSure: 'Da li si siguran/na?',
    deleteForever: 'Da, obriši nalog',
    cancel: 'Otkaži',
  },
  hu: {
    tagline: 'Jelentsd a kellemetlen szagot a környékeden.',
    logOut: 'Kijelentkezés',
    myAccount: 'Fiókom',
    home: 'Főoldal',
    reportTab: 'Bejelentés',
    menu: 'Menü',
    guestNotice: 'Vendégként használod az alkalmazást.',
    createAccount: 'Hozz létre fiókot a bejelentéseid megőrzéséhez',

    // Sign-in screen
    privacyTitle: 'Adatvédelmi tájékoztató',
    privacyIntro: 'Mielőtt folytatod, olvasd el, hogyan használjuk az adataidat.',
    acceptAndContinue: 'Elfogadom és folytatom',
    continueAsGuest: 'Folytatás fiók nélkül',
    or: 'vagy',
    email: 'E-mail',
    password: 'Jelszó',
    name: 'Név',
    logIn: 'Bejelentkezés',
    register: 'Fiók létrehozása',
    haveAccount: 'Van már fiókod? Jelentkezz be',
    noAccount: 'Nincs fiókod? Hozz létre egyet',
    wrongLogin: 'Hibás e-mail vagy jelszó.',
    emailTaken: 'Ezzel az e-mail-címmel már van fiók.',
    passwordTooShort: 'A jelszónak legalább 8 karakterből kell állnia.',
    somethingWrong: 'Valami hiba történt. Próbáld újra.',

    // Report form
    location: 'Hely',
    locating: 'Helymeghatározás…',
    locationFound: 'Hely megtalálva',
    locationOff: 'Kapcsold be a helymeghatározást (GPS) a telefonon, majd nyomd meg az „Újra” gombot.',
    locationDenied: 'A böngésző nem engedi a helyhozzáférést. Engedélyezd a böngésző beállításaiban, majd próbáld újra.',
    unknownArea: 'Ismeretlen terület',
    tryAgain: 'Újra',
    howStrong: 'Mennyire erős a szag?',
    odorKindOptional: 'Milyen a szag? (nem kötelező)',
    describeOther: 'Írd le a szagot',
    removeOdorKind: 'Szagfajta törlése',
    commentOptional: 'Megjegyzés (nem kötelező)',
    commentHint: 'Csak te látod.',
    sendReport: 'Bejelentés küldése',
    sending: 'Küldés…',
    tooMany: 'Az elmúlt órában sok bejelentést küldtél. Próbáld később.',
    thanks: 'Köszönjük! A bejelentés elküldve.',
    reportAgain: 'Új bejelentés',

    // Account screen
    accountType: 'Fiók típusa',
    guestAccount: 'Vendég',
    fullAccount: 'Fiók',
    memberSince: 'Regisztráció dátuma',
    deleteAccount: 'Fiók törlése',
    deleteWarning: 'A fiókod törlődik. A bejelentések a térképen maradnak, de nem köthetők hozzád, és megjegyzés nélkül. Ez nem vonható vissza.',
    deleteAreYouSure: 'Biztos vagy benne?',
    deleteForever: 'Igen, törlöm a fiókot',
    cancel: 'Mégse',
  },
} satisfies Record<Language, unknown>;

export type Texts = (typeof TEXTS)['sr'];
