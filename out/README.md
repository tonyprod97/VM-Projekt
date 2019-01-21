# **VM Projekt** #

Web aplikacija razvijena u sklopu kolegija *Projekt iz progranske potpore*. 
Clanovi projektnog tima: 
* *Antionio Kmaber*
* *Kristijan Vrbanc*
* *Lovro Knezevic*
* *Mateo Majnaric*
* *Lara Lokin*
* *Martin Srsen*

## Tehnicke znacajke aplikacije ##

Web aplikacija razvijena je uporabom tehnologije *Node.js*, okruzenja koje omogucuje izvodenje programskog koda pisanog u programskom jeziku *JavaScript* izvan web-preglednika. Konkretno, koristen je Node.js-ov framework *Express.js*, koji znacajno pojednostavljuje izgradnju web aplikacije. Za prikaz sucelja prema korisniku koristene su tehnologije *HTML* i *CSS* prosirene sustavom predlozaka („template system“) *Handlebars.js*. 
Za skladistenje podataka aplikacije koristena je baza podataka *Microsoft Azure*.

## Opis aplikacije ##

Svrha ove aplikacije je pojednostavljenje komunikacije studenata i nastavnika prilikom ugovora sastanaka. Glavno sucelje aplikacije je **kalendar**, u kojemu su jasno naznaceni svi zauzeti termini prijavljenog korisnika. 
Postoje tri tipa korisnika sustava:
1. Student
2. Nastavnik
3. Administrator sustava

Svi korisnici **prijavljuju** se u sustav svojim adresama elektronicke poste i odgovarajucim lozinkama. Ukoliko ne posjeduju racun, korisnici se mogu **registrirati** ispunjujuci odgovarajuci web obrazac. Nakon registracije korisnik je obavezan **potvrditi** svoj račun klikom na verifikacijski link koji mu je poslan na adresu elektronicke poste.
Svaki korisnik, prilikom registracije, odavire svoju ulogu u sustavu ( *STUDENT* ili *NASTAVNIK*), dok je *administrator* iskljucivo jedan korisnik, vec unesen u sustav.
Svaki korisnik ima mogucnost sinkronizacije svoga **Outlook racuna** sa aplikacijom, kako bi se u kalendar aplikacije sinkronizirao sa kalendarom aplikacije *Outlook*.
Skup mogucnosti *nastavnika* prosiren je mogucnoscu odabira termina koji ce se osloboditi za ugovaranje sastanaka.
Osnovni slijed komunikacije korisnika sustava:  
* Nakon prijave u sustav, student je u mogucnosti **odabrati** nastavnika kojeg zeli pratiti ( vidjeti njegov kalendar).
* Student dobiva na uvid kalendar nastavnika. Student nije u mogućnosti vidjeti cjelokupan kalendar nastavnika, nego isključivo termine koje je nastavnik naznačio kao slobodne. Student je u mogućnosti **rezervirati** termin.  Osnovni tijek aktivnosti prilikom rezervacije termina:
   * Student odabire slobodan termin u kalendaru nastavnika te odabire vremensko trajanje i uzrok rezervacije
   * Na kalendaru nastavnika automatski se naznacuje mjesto koje student pokusava rezervirati
   * Na adresu elektronicke poste nastavnika salje se obavijest o pokusaju rezervacije. Obavijest ulkucuje ime korisnika koji je pokusao rezervirati sastanak te vremensko trajanje rezervacije. Nastavnik takoder dobiva na odabir prihvat ili odbijanje rezervacije.
        * Ukoliko nastavnik **prihvati** rezervaciju, na adresu elektronicke poste studenta se salje obavijest o potvrdi rezervacije. Student takoder dobiva na odabir zeli li azurirati kalendar tim dogadajem. Ukoliko student odabere opciju azuriranja, azuriraju se kalendari studenta i nastavnika tako da se zauzmu vremena u kojima se dogovorila rezervacija. Aplikacija se sinkronizira sa aplikacijom *Outlook*,te se taj novi dogadaj pojavljuje u kalendaru aplikacije *Outlook*, kako studenta, tako i nastavnika.
        * Ukoliko nastavnik **odbije** rezervaciju, u kalendaru nastavnika se brise pokusaj rezervacije.

### Stablo direktorija aplikacije ###

Prikaz stabla direktorija aplikacije:
```
|---.vs
|   |---VMprojektLocation
|       |---v15
|---app
|   |---constants
|   |---DatabaseManager
|   |---EmailManager
|   |---OutlookManager
|   |---routes
|   |   |---calendar
|   |   |---outlook
|   |   |---user
|   |---scripts
|   |   |---calendar
|   |---styles
|   |   |---calendar
|   |   |---pictures
|   |---UrlManager
|   |---views
|       |---calendar
|       |---layouts
|       |---partials
|       |---user
|---node_modules
|---out
    |---fonts
    |---scripts
    |   |---prettify
    |---styles
```

* U direktoriju **app** nalaze se svi *source* kodovi aplikacije.
    * poddirektorij **constants** - definiranje globalih objekata
    * poddirektorij **DatabaseManager** - komunikacija sa bazom podataka
    * poddirektorij **EmailManager** - komunikacija sa korisnickim e-mailom
    * poddirektorij **OutlookManager** - komunikacija sa aplikacijom *Outlook*
    * poddirektorij **routes** - definiranje globalih objekata
    * poddirektorij **scripts** - definiranje *JavaScript* skripti vezanih za prikaz korisnickog sucelja
    * poddirektorij **styles** - definiranje *CSS* datoteka
    * poddirektorij **UrlManager** -definiranje URL mappinga
    * poddirektorij **views** - *HTML* datoteke koje definiranju izgled web stranica 
* U direktoriju **node_modules** nalaze se svi *source* kodovi koristenih *JavaScript* paketa.
* U direktoriju **out** nalazi se dokumentacija aplikacije. Poddirektoriji **fonts**, **scripts**, **styles** sadrze datoteke koje su potrebne kako bi se generirala dokumentacija, a sama dokumentacija nalazi se u *.html* datotekama koje se nalaze u samom direktoriju **out**. 