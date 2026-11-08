from decimal import Decimal, ROUND_HALF_UP
from models import QuoteCreate

def calculate_quote_totals(quote: QuoteCreate):
    total_net = Decimal('0.00')
    total_vat = Decimal('0.00')
    
    for section in quote.sections:
        # Le opzioni escluse (es. OPZIONE 2) non fanno somma
        if section.is_optional:
            continue
            
        for line in section.lines:
            # Calcolo Riga: Quantità x Prezzo (senza sconti, come da SPEC.md aggiornato)
            raw_net = line.qty * line.unit_price
            line_net = raw_net.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            # Calcolo IVA della riga
            raw_vat = line_net * (Decimal(line.vat_rate) / Decimal('100'))
            line_vat = raw_vat.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            total_net += line_net
            total_vat += line_vat
            
    total_gross = total_net + total_vat
    
    return {
        "total_net": total_net,
        "total_vat": total_vat,
        "total_gross": total_gross
    }