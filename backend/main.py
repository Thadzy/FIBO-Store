from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Format: postgresql://user:password@host:port/database_name
DATABASE_URL = "postgresql://admin:admin12345678@localhost:5432/fibo_store_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPI app initialization
app =FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],      
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to FIBO Store API! 🚀"}

# Database connection test endpoint
@app.get("/test-db")
def test_db_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 'Database Connected!'"))
            return {"status": "success", "message": result.scalar()}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# Sample endpoint to fetch items from a hypothetical 'items' table
@app.get("/items")
def read_items():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM items"))
            items = [dict(row._mapping) for row in result]
            return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))