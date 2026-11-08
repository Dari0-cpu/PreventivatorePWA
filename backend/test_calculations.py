import pytest
from decimal import Decimal
from uuid import uuid4
from pydantic import ValidationError

from models import QuoteCreate, QuoteSectionCreate, QuoteLineCreate
from calculations import calculate_quote_totals

def test_decimal_quantities_and_half_up_rounding():
    """Caso limite: quantità con decimali (es. 2.5 ore) e arrotondamento contabile ROUND_HALF_UP."""
    # 2.5 ore * 45.50 €/h = 113.75 € (Imponibile)
    # IVA 22% su 113.75 € = 25.025 € -> Arrotondato ROUND_HALF_UP a 25.03 €
    quote = QuoteCreate(
        client_id=uuid4(),
        object_title="Intervento manodopera",
        sections=[
            QuoteSectionCreate(
                title="Manodopera",
                sort_order=1,
                lines=[
                    QuoteLineCreate(
                        description="Manodopera specializzata",
                        qty=Decimal("2.5"),
                        unit_price=Decimal("45.50"),
                        vat_rate=22,
                        sort_order=1
                    )
                ]
            )
        ]
    )

    result = calculate_quote_totals(quote)

    assert result["total_net"] == Decimal("113.75")
    assert result["total_vat"] == Decimal("25.03")
    assert result["total_gross"] == Decimal("138.78")


def test_mixed_vat_rates_10_and_22():
    """Caso limite: aliquote IVA miste al 10% (beni/manodopera agevolata) e 22% nello stesso preventivo."""
    quote = QuoteCreate(
        client_id=uuid4(),
        object_title="Impianto climatizzazione negozio",
        sections=[
            QuoteSectionCreate(
                title="Climatizzazione",
                sort_order=1,
                lines=[
                    QuoteLineCreate(
                        description="Climatizzatore Dual Split LG",
                        qty=Decimal("1"),
                        unit_price=Decimal("2000.00"),
                        vat_rate=10,  # IVA 10% = 200.00
                        sort_order=1
                    ),
                    QuoteLineCreate(
                        description="Canalina PVC e staffe",
                        qty=Decimal("2"),
                        unit_price=Decimal("150.00"),
                        vat_rate=22,  # Imponibile 300.00, IVA 22% = 66.00
                        sort_order=2
                    )
                ]
            )
        ]
    )

    result = calculate_quote_totals(quote)

    assert result["total_net"] == Decimal("2300.00")
    assert result["total_vat"] == Decimal("266.00")
    assert result["total_gross"] == Decimal("2566.00")


def test_optional_section_excluded_from_totals():
    """Verifica che le sezioni con is_optional=True (es. 'OPZIONE 2' o scenari mutuamente esclusivi) non sommino al totale."""
    quote = QuoteCreate(
        client_id=uuid4(),
        object_title="Riparazione perdita bagno",
        sections=[
            QuoteSectionCreate(
                title="OPZIONE 1 - Riparazione parziale",
                is_optional=False,
                sort_order=1,
                lines=[
                    QuoteLineCreate(
                        description="Riparazione perdita",
                        qty=Decimal("1"),
                        unit_price=Decimal("6140.00"),
                        vat_rate=10,
                        sort_order=1
                    )
                ]
            ),
            QuoteSectionCreate(
                title="OPZIONE 2 - Rifacimento completo",
                is_optional=True,  # Questo intero blocco deve essere ignorato dai calcoli
                sort_order=2,
                lines=[
                    QuoteLineCreate(
                        description="Rifacimento impianto completo",
                        qty=Decimal("1"),
                        unit_price=Decimal("9680.00"),
                        vat_rate=10,
                        sort_order=1
                    )
                ]
            )
        ]
    )

    result = calculate_quote_totals(quote)

    assert result["total_net"] == Decimal("6140.00")
    assert result["total_vat"] == Decimal("614.00")
    assert result["total_gross"] == Decimal("6754.00")


def test_floating_point_precision_trap():
    """Verifica l'assenza di errori di virgola mobile (0.10 + 0.20 == 0.30 esatto, non 0.30000000000000004)."""
    quote = QuoteCreate(
        client_id=uuid4(),
        object_title="Test precisione Decimal",
        sections=[
            QuoteSectionCreate(
                title="Sezione",
                sort_order=1,
                lines=[
                    QuoteLineCreate(description="Voce A", qty=Decimal("1"), unit_price=Decimal("0.10"), vat_rate=22, sort_order=1),
                    QuoteLineCreate(description="Voce B", qty=Decimal("1"), unit_price=Decimal("0.20"), vat_rate=22, sort_order=2),
                ]
            )
        ]
    )

    result = calculate_quote_totals(quote)
    
    assert result["total_net"] == Decimal("0.30")
    assert isinstance(result["total_net"], Decimal)


@pytest.mark.parametrize(
    "invalid_payload",
    [
        # Aliquota IVA non valida
        {"description": "Voce", "qty": Decimal("1.0"), "unit_price": Decimal("100.00"), "vat_rate": 150, "sort_order": 1},
        {"description": "Voce", "qty": Decimal("1.0"), "unit_price": Decimal("100.00"), "vat_rate": 0, "sort_order": 1},
    ]
)
def test_invalid_vat_rates_raise_error(invalid_payload):
    """Aliquote IVA diverse da 4, 10 o 22 devono essere bloccate istantaneamente da Pydantic."""
    with pytest.raises(ValidationError):
        QuoteLineCreate(**invalid_payload)