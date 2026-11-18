// Every text on screen, in Serbian (Latin script) and Hungarian.
// Names of odor kinds, strengths and durations come from LABELS in @odormap/common.
//
// Use: const t = TEXTS[language];  then  t.sendReport
//
// These translations still need checking by native speakers.

import type { Language } from '@odormap/common';

export const TEXTS = {
  sr: {
    tagline: 'Prijavi neprijatan miris u svom kraju.',
    logOut: 'Odjavi se',
    guestNotice: 'Koristiš aplikaciju kao gost.',
    createAccount: 'Napravi nalog da sačuvaš prijave',

    // Sign-in screen
    acceptPrivacy: 'Pročitao/la sam i prihvatam obaveštenje o privatnosti',
    privacyTitle: 'Obaveštenje o privatnosti',
    privacyRequired: 'Prvo prihvati obaveštenje o privatnosti.',
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
    back: 'Nazad',

    // Report form
    whereAreYou: 'Gde si?',
    locating: 'Tražim tvoju lokaciju…',
    locationFound: (accuracy: number) => `Lokacija pronađena (±${accuracy} m)`,
    locationDenied: 'Dozvoli pristup lokaciji u podešavanjima pregledača, pa pokušaj ponovo.',
    locationFailed: 'Lokacija nije pronađena.',
    tryAgain: 'Pokušaj ponovo',
    howStrong: 'Koliko je jak miris?',
    moreDetails: 'Više detalja (nije obavezno)',
    whatKind: 'Kakav je miris?',
    describeOther: 'Opiši miris',
    howLong: 'Koliko dugo traje?',
    comment: 'Komentar',
    commentHint: 'Vidiš ga samo ti.',
    sendReport: 'Pošalji prijavu',
    sending: 'Šaljem…',
    outsideArea: 'Ova lokacija je van oblasti koje OdorMap pokriva.',
    tooMany: 'Poslao/la si mnogo prijava u poslednjih sat vremena. Pokušaj kasnije.',
    thanks: 'Hvala! Prijava je poslata.',
    reportAgain: 'Nova prijava',
  },
  hu: {
    tagline: 'Jelentsd a kellemetlen szagot a környékeden.',
    logOut: 'Kijelentkezés',
    guestNotice: 'Vendégként használod az alkalmazást.',
    createAccount: 'Hozz létre fiókot a bejelentéseid megőrzéséhez',

    // Sign-in screen
    acceptPrivacy: 'Elolvastam és elfogadom az adatvédelmi tájékoztatót',
    privacyTitle: 'Adatvédelmi tájékoztató',
    privacyRequired: 'Előbb fogadd el az adatvédelmi tájékoztatót.',
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
    back: 'Vissza',

    // Report form
    whereAreYou: 'Hol vagy?',
    locating: 'Helymeghatározás…',
    locationFound: (accuracy: number) => `Hely megtalálva (±${accuracy} m)`,
    locationDenied: 'Engedélyezd a helyhozzáférést a böngésző beállításaiban, majd próbáld újra.',
    locationFailed: 'Nem sikerült meghatározni a helyet.',
    tryAgain: 'Újra',
    howStrong: 'Mennyire erős a szag?',
    moreDetails: 'További részletek (nem kötelező)',
    whatKind: 'Milyen a szag?',
    describeOther: 'Írd le a szagot',
    howLong: 'Mióta tart?',
    comment: 'Megjegyzés',
    commentHint: 'Csak te látod.',
    sendReport: 'Bejelentés küldése',
    sending: 'Küldés…',
    outsideArea: 'Ez a hely kívül esik az OdorMap által lefedett területeken.',
    tooMany: 'Az elmúlt órában sok bejelentést küldtél. Próbáld később.',
    thanks: 'Köszönjük! A bejelentés elküldve.',
    reportAgain: 'Új bejelentés',
  },
} satisfies Record<Language, unknown>;

export type Texts = (typeof TEXTS)['sr'];
