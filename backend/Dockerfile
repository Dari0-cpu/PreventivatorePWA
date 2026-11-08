# 1. Partiamo da un "mini-computer" Linux vuoto che ha già Python 3.11 installato
FROM python:3.11-slim

# 2. Diciamo a questo mini-computer di lavorare dentro una cartella chiamata /app
WORKDIR /app

# 3. Copiamo il file con la lista della spesa (le librerie) dal tuo PC dentro la scatola
COPY requirements.txt .

# 4. Gli facciamo scaricare e installare le librerie (FastAPI, Pydantic, ecc.)
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiamo tutto il resto del tuo codice (main.py, calculations.py) dentro la scatola
COPY . .

# 6. Diciamo alla scatola di lasciare "aperta" la porta 8000 per far passare i dati
EXPOSE 8000

# 7. Il comando che la scatola deve eseguire appena viene accesa: avviare Uvicorn!
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]