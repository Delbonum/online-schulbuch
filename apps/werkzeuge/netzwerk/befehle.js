// Befehlszeile eines simulierten Rechners (ohne DOM, testbar).

import { gueltigeIp } from './netz.js';

export const HILFE = [
  'Verfügbare Befehle:',
  '  ipconfig              eigene Netzwerkeinstellungen anzeigen',
  '  ping ZIEL             Erreichbarkeit prüfen (IP-Adresse oder Name)',
  '  traceroute ZIEL       Weg zum Ziel über die Router anzeigen (auch: tracert)',
  '  host NAME             Namen über den DNS-Server auflösen (auch: nslookup)',
  '  host -t mx DOMAIN     Mailserver einer Domain erfragen (MX-Eintrag)',
  '  arp                   ARP-Tabelle anzeigen (IP-Adresse → MAC-Adresse)',
  '  route                 Weiterleitungstabelle anzeigen',
  '  netstat               offene TCP-Verbindungen anzeigen',
  '  cls                   Bildschirm leeren',
];

/**
 * Führt eine Befehlszeile aus.
 * @param {import('./netz.js').Netz} netz
 * @param {object} g Gerät
 * @param {string} zeile
 * @param {(text: string) => void} ausgabe
 * @param {() => void} fertig  wird aufgerufen, wenn der Befehl beendet ist
 * @returns {'leeren'|undefined}
 */
export function fuehreAus(netz, g, zeile, ausgabe, fertig) {
  const [befehl = '', ...argumente] = zeile.trim().split(/\s+/);
  const arg = argumente.filter((a) => !a.startsWith('-') && !a.startsWith('/'))[0];
  const z = netz.zustand?.get(g.id);
  switch (befehl.toLowerCase()) {
    case '':
      fertig();
      return undefined;
    case 'help': case 'hilfe': case '?':
      HILFE.forEach(ausgabe);
      fertig();
      return undefined;
    case 'cls': case 'clear':
      fertig();
      return 'leeren';
    case 'ipconfig': case 'ifconfig':
      g.nics.forEach((nic, i) => {
        ausgabe(`Netzwerkkarte ${g.nics.length > 1 ? i + 1 : ''}`.trim());
        ausgabe(`  IP-Adresse . . . . . : ${nic.ip || '(keine)'}`);
        ausgabe(`  Netzmaske  . . . . . : ${nic.maske || '(keine)'}`);
        ausgabe(`  MAC-Adresse  . . . . : ${nic.mac}`);
      });
      if (g.typ !== 'router') {
        ausgabe(`  Gateway  . . . . . . : ${g.gateway || '(keines)'}`);
        ausgabe(`  DNS-Server . . . . . : ${g.dns || '(keiner)'}`);
        if (g.dhcp) ausgabe('  (Einstellungen per DHCP bezogen)');
      }
      fertig();
      return undefined;
    case 'ping':
      if (!arg) { ausgabe('Aufruf: ping ZIEL   (z. B. ping 192.168.0.2)'); fertig(); return undefined; }
      netz.ping(g, arg, ausgabe, fertig);
      return undefined;
    case 'traceroute': case 'tracert':
      if (!arg) { ausgabe('Aufruf: traceroute ZIEL'); fertig(); return undefined; }
      netz.traceroute(g, arg, ausgabe, fertig);
      return undefined;
    case 'host': case 'nslookup': {
      const mx = /-t\s*mx|type=mx/i.test(zeile);
      const name = argumente.filter((a) => !a.startsWith('-') && !/^(mx|a)$/i.test(a) && !/^type=/i.test(a))[0];
      if (mx && name) {
        netz.namensaufloesung(g, name, (wert, fehler) => { ausgabe(wert ? `${name}: Mailserver (MX) ist ${wert}` : fehler); fertig(); }, 'MX');
        return undefined;
      }
      if (!arg) { ausgabe('Aufruf: host NAME   (z. B. host www.schule.de)'); fertig(); return undefined; }
      if (gueltigeIp(arg)) { ausgabe(`${arg} ist schon eine IP-Adresse.`); fertig(); return undefined; }
      netz.namensaufloesung(g, arg, (ip, fehler) => {
        ausgabe(ip ? `${arg} hat die Adresse ${ip}` : fehler);
        fertig();
      });
      return undefined;
    }
    case 'arp': {
      const eintraege = [...(z?.arp ?? new Map())];
      if (!eintraege.length) ausgabe('Die ARP-Tabelle ist leer.');
      else {
        ausgabe('IP-Adresse        MAC-Adresse');
        for (const [ip, e] of eintraege) ausgabe(`${ip.padEnd(18)}${e.mac}`);
      }
      fertig();
      return undefined;
    }
    case 'route': {
      ausgabe('Ziel              Netzmaske         Gateway           Schnittstelle');
      for (const r of netz.routingTabelle(g)) {
        ausgabe(`${r.ziel.padEnd(18)}${r.maske.padEnd(18)}${(r.gateway || '–').padEnd(18)}${g.nics[r.nic]?.ip || '–'}`);
      }
      fertig();
      return undefined;
    }
    case 'netstat': {
      const v = [...(z?.tcp ?? new Map()).values()];
      if (!v.length) ausgabe('Keine offenen TCP-Verbindungen.');
      for (const c of v) ausgabe(`TCP  lokal Port ${c.quellPort}  ↔  ${c.ziel}:${c.zielPort}  (${c.zustand})`);
      if (g.daten.webserver?.laeuft && g.software.includes('webserver')) ausgabe('TCP  Port 80 wartet auf Verbindungen (Webserver)');
      if (g.daten.dnsserver?.laeuft && g.software.includes('dnsserver')) ausgabe('UDP  Port 53 wartet auf Anfragen (DNS-Server)');
      if (g.daten.echoserver?.laeuft && g.software.includes('echoserver')) ausgabe(`TCP  Port ${g.daten.echoserver.port || 55555} wartet auf Verbindungen (Echo-Server)`);
      if (g.daten.emailserver?.laeuft && g.software.includes('emailserver')) { ausgabe('TCP  Port 25 wartet auf Verbindungen (SMTP)'); ausgabe('TCP  Port 110 wartet auf Verbindungen (POP3)'); }
      fertig();
      return undefined;
    }
    default:
      ausgabe(`Unbekannter Befehl: ${befehl}. Mit „help“ siehst du alle Befehle.`);
      fertig();
      return undefined;
  }
}
