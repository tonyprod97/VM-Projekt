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
Svaki korisnik, prilikom registracije, odavire svoju ulogu u sustavu ( *STUDENT* ili *NASTAVNIK*).
Svaki korisnik ima mogucnost sinkronizacije svoga **Outlook racuna** sa aplikacijom, kako bi se u kalendar aplikacije sinkronizirao sa kalendarom aplikacije *Outlook*.
Osnovni slijed komunikacije korisnika sustava:  
* Nakon prijave u sustav, student je u mogucnosti **odabrati** nastavnika kojeg zeli pratiti ( vidjeti njegov kalendar, odnosno njegove zauzete termine).
* Studen dobiva na uvid kalendar nastavnika te ukoliko postoje slobodni termini predodredeni za sastanke ( odreduje nastavnik), student je u mogucnosti **rezervirati** termin. Osnovni tijek aktivnosti prilikom rezervacije termina:
   * Student odabire slobodan termin u kalendaru nastavnika te odabire vremensko trajanje i uzrok rezervacije
   * Na adresu elektronicke poste nastavnika salje se obavijest u kojoj nastavnik dobiva na izbor prihvat ili odbijanje rezervacije
        * Ukoliko nastavnik **prihvati** rezervaciju, na adresu elektronicke poste studenta se salje obavijest o uspjesnoj rezervaciji sa gdje student dobiva odabir zeli li azurirati svoj kalendar ovim dogadajem. Ukoliko student odabere opciju azuriranja, azuriraju se kalendari studenta i nastavnika tako da se zauzmu vremena u kojima se dogovorila rezervacija.
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