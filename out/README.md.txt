# Opis aplikacije #

Svrha ove aplikacije je pojednostavljenje komunikacije studenata i nastavnika prilikom ugovora sastanaka. Glavno sučelje aplikacije je **kalendar**, u kojemu su jasno naznačeni svi zauzeti termini prijavljenog korisnika. 
Postoje tri tipa korisnika sustava:
1. Student
2. Nastavnik
3. Administrator sustava
Svi korisnici **prijavljuju** se u sustav svojim adresama elektroničke pošte i odgovarajućim lozinkama. Ukoliko ne posjeduju račun, korisnici se mogu **registrirati** u odgovarajučem web obrascu.
Svaki korisnik, nakon registracije, dobiva status *STUDENTA*. *NASTAVNIK* je korisnik sustava kojega je nakon prijave administrator sustava odobrio i pridjenuo mu ulogu nastavnika.
Svaki korisnik ima mogućnost sinkronizacije svoga **Outlook računa** sa aplikacijom, kako bi se u kalendar aplikacije sinkronizirao sa kalendarom aplikacije **Outlook**.
Osnovni slijed komunikacije korisnika sustava:  
* Nakon prijave u sustav, **student** je u mogućnosti odabrati **nastavnika** kojeg želi pratiti ( vidjeti njegov kalendar, odnosno njegove zauzete termine). Student odabire nastavnika te odabire razlog praćenja. Nastavniku se šalje obavijest na adresu elektroničke pošte u kojoj nastavnik može prihvatiti ili odbiti praćenje. Ukoliko nastavnik **prihvati**, student dobiva na uvid kalendar nastavnika.
* Nakon što je studentu odobreno praćenje nastavnika, student je u mogućnosti rezervirati termin u slobodnom vremenu nastavnika. Osnovni tijek aktivnosti prilikom rezervacije termina:
   * Student odabire slobodan termin u kalendaru nastavnika te odabire vremensko trajanje i uzrok rezervacije
   * Na  