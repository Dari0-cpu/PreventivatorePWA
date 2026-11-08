from fastapi import FastAPI, HTTPException, status
from models import QuoteCreate
from calculations import calculate_quote_totals

app = FastAPI(
    title="AvanguarDesk API", 
    description="Backend per Preventivatore Offline-First"
)

@app.get("/api/v1/quotes")
def get_quotes():
    return {"message": "Ritorna la lista dei preventivi (Da collegare a Supabase)"}

@app.get("/api/v1/quotes/{quote_id}")
def get_quote(quote_id: str):
    return {"message": f"Ritorna il preventivo {quote_id} completo di sezioni e righe"}

@app.post("/api/v1/quotes", status_code=status.HTTP_201_CREATED)
def create_quote(quote: QuoteCreate):
    # 1. FastAPI ha già validato automaticamente il JSON grazie a Pydantic
    
    # 2. Passiamo i dati validati al motore matematico
    totals = calculate_quote_totals(quote)
    
    # 3. Qui inserirai i dati e i totali nel database Supabase
    
    return {
        "status": "success",
        "message": "Preventivo validato e calcolato",
        "calculated_totals": totals,
        "payload": quote
    }

@app.put("/api/v1/quotes/{quote_id}")
def update_quote(quote_id: str, quote: QuoteCreate):
    return {"message": f"Aggiorna il preventivo {quote_id}"}

@app.delete("/api/v1/quotes/{quote_id}")
def delete_quote(quote_id: str):
    return {"message": f"Elimina il preventivo {quote_id}"}