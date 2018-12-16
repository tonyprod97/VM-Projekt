# Opis aplikacije #

Svrha ove aplikacije je pojednostavljenje komunikacije studenata i nastavnika prilikom ugovora sastanaka. Glavno sucelje aplikacije je **kalendar**, u kojemu su jasno naznaceni svi zauzeti termini prijavljenog korisnika. 
Postoje tri tipa korisnika sustava:
1. Student
2. Nastavnik
3. Administrator sustava

Svi korisnici **prijavljuju** se u sustav svojim adresama elektronicke poste i odgovarajucim lozinkama. Ukoliko ne posjeduju racun, korisnici se mogu **registrirati** u odgovarajucem web obrascu.
Svaki korisnik, nakon registracije, dobiva status *STUDENTA*. *NASTAVNIK* je korisnik sustava kojega je nakon prijave administrator sustava odobrio ulogu nastavnika.
Svaki korisnik ima mogucnost sinkronizacije svoga **Outlook racuna** sa aplikacijom, kako bi se u kalendar aplikacije sinkronizirao sa kalendarom aplikacije **Outlook**. Svaki korisnik je u mogucnosti dodavati dogadaje u kalendar i brisati dogadaje iz kalendara koristeci aplikaciju.
Osnovni slijed komunikacije korisnika sustava:  
* Nakon prijave u sustav, **student** je u mogucnosti odabrati **nastavnika** kojeg zeli pratiti ( vidjeti njegov kalendar, odnosno njegove zauzete termine). Student odabire nastavnika te odabire razlog pracenja. Nastavniku se salje obavijest na adresu elektronicke poste u kojoj nastavnik moze prihvatiti ili odbiti pracenje. Ukoliko nastavnik **prihvati**, student dobiva na uvid kalendar nastavnika.
* Nakon sto je studentu odobreno pracenje nastavnika, student je u mogucnosti rezervirati termin u slobodnom vremenu nastavnika. Osnovni tijek aktivnosti prilikom rezervacije termina:
   * Student odabire slobodan termin u kalendaru nastavnika te odabire vremensko trajanje i uzrok rezervacije
   * Na kalendaru nastanika automatski se naznacuje mjesto koje student pokusava rezervirati- poprimi sivu boju
   * Na adresu elektronicke poste nastavnika salje se obavijest u kojoj nastavnik dobiva na izbor prihvat, odbijanje rezervacije ili predlaganje nekog drugog termina rezervacije
        * Ukoliko nastavnik prihvati rezervaciju, azuriraju se kalendari studenta i nastavnika tako da se zauzmu vremena u kojima se dogovorila rezervacija. Na adresu elektronicke poste studenta se salje obavijest o uspjesnoj rezervaciji.
        * Ukoliko nastavnik odbije rezervaciju, u kalendaru nastavnika se brise pokusaj rezervacije. Na adresu elektronice poste studenta se salje obavijest o neuspjesnoj rezervaciji.
        * Ukoliko nastavnik predlozi neki drugi termin, obavijest sa prijedlogom se salje na adresu elektronicke poste studenta te ukoliko student prihvati promjenu termina, azuriraju se kalendari nastavnika i studenta na mjestu gdje je dogovoren novi termin.   

## Stablo direktorija aplikacije ##

Prikaz stabla direktorija aplikacije:
```
|---.vs
|   |---VMprojektLocation
|       |---v15
|---app
|   |---constants
|   |---DatabaseManager
|   |---OutlookManager
|   |---routes
|   |   |---calendar
|   |   |---user
|   |---scripts
|   |   |---calendar
|   |---styles
|   |   |---calendar
|   |---views
|       |---calendar
|       |---layouts
|       |---partials
|       |---user
|---out
    |---fonts
    |---scripts
    |   |---prettify
    |---styles
```

* U direktoriju **app** nalaze se svi *source* kodovi aplikacije.
* U direktoriju **out** nalazi se dokumentacija aplikacije. Poddirektoriji **fonts**, **scripts**, **styles** sadrze datoteke koje su potrebne kako bi se generirala dokumentacija, a sama dokumentacija nalazi se u *.html* datotekama koje se nalaze u samom direktoriju **out**. 