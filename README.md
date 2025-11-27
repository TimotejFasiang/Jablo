# Technický úkol – VIES (validace DIČ)

<img width="1895" height="3390" alt="mermaid_diagram_Jablotron" src="https://github.com/user-attachments/assets/8b000d03-0c4d-40d8-a700-94d82f439eca" />

# Testovací přístup

### Unit testy

**`orders.service.test.js`**
  - Rozhodovací logika mezi synchronním a asynchronním postupem
  - Scénáře timeoutu 3 sekund
  - Scénáře bez DIČ a s DIČ

**`vat.service.test.js`**
  - Logika opakování s backoffem
  - Zpracování odpovědí VIES (validní, neplatné, chyby)
  - Zvládání timeoutů

**`vat.processor.test.js`**
  - Úspěšné zpracování úloh ve frontě
  - Scénáře selhání a záložní logika
  - Emailové notifikace po validaci

**`vies.client.test.js`**
  - HTTP/SOAP komunikace s VIES
  - Parsování odpovědí VIES
  - Zpracování chyb sítě

### Integrační testy
**`order-creation.integration.test.js`**
  - Kompletní flow GraphQL mutation -> databáze -> fronta
  - Reálná testovací databáze s mockovanou frontou
  - Mockované VIES API pro různé scénáře

**`queue-processing.integration.test.js`**
  - Kompletní async flow: fronta -> VIES -> email
  - Mechanismus opakování s ověřením časování
  - Aktualizace stavu objednávky po async validaci

**`payment-flow.integration.test.js`**
  - Generování platebních odkazů
  - Doručování emailů s různými stavy DPH
  - Správný výpočet DPH na základě validace

### End-to-End testy

1. **Happy Path - Rychlá odpověď VIES**
   - Uživatel zadá platné DIČ -> VIES odpoví <3s -> okamžitá webová platba

2. **Slow Path - Timeout VIES**
   - Uživatel zadá DIČ -> VIES timeout >3s -> emailový platební proces
   - Ověření doručení emailu po úspěšné validaci

3. **Bez čísla DIČ**
   - Uživatel nezadá DIČ -> okamžitá platba s DPH

4. **Scénář selhání VIES**
   - VIES API kompletně nedostupné -> záložní režim s DPH
   - Ověření, že uživatel stále může dokončit platbu
