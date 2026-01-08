from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List
from datetime import datetime

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

# Data Models (Schema)
# Frontend data send
class BookingItemRequest(BaseModel):
    item_id: int
    quantity: int 

class BookingRequest(BaseModel):
    user_id: int = 1; # Default 
    pickup_date: str
    due_date: str
    purpose: str
    items: List[BookingItemRequest]

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
    
# Booking endpoint
@app.post("/bookings")
def create_booking(request: BookingRequest):
    try:
        with engine.begin() as connection:
            # Insert into bookings table
            booking_query = text("""
                INSERT INTO bookings (user_id, pickup_date, due_date, purpose, status)
                VALUES (:user_id, :pickup_date, :due_date, :purpose, 'Pending')
                RETURNING booking_id""")
            
            result = connection.execute(booking_query, {
                "user_id" : request.user_id,
                "pickup_date": request.pickup_date,
                "due_date": request.due_date,
                "purpose": request.purpose
            })

            new_booking_id = result.scalar()
            
            # Loop through items and insert into booking_items table
            for item in request.items:
                # Check stock availability
                check_stock = connection.execute(
                    text("SELECT available_quantity FROM items WHERE item_id = :item_id"),
                    {"item_id": item.item_id}
                ).scalar()

                if check_stock is None:
                    raise HTTPException(status_code=404, detail=f"Item ID {item.item_id} not found.")
                
                if check_stock < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for Item ID {item.item_id}.")
                
            # Deduct stock and insert booking items
            connection.execute(text("""
                INSERT INTO booking_items (booking_id, item_id, quantity)
                VALUES (:booking_id, :item_id, :quantity)"""), {
                    "booking_id": new_booking_id,
                    "item_id": item.item_id,
                    "quantity": item.quantity
                })
            
            connection.execute(text("""
                UPDATE items
                SET available_quantity = available_quantity - :quantity
                WHERE item_id = :item_id"""), {
                    "quantity": item.quantity,
                    "item_id": item.item_id
                })
            
            return {
                "status": "success", 
                "message": "Booking created successfully!", 
                "booking_id": new_booking_id
            }        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error: {e}") # ปริ้นท์ลง Terminal ไว้ดู debug
        raise HTTPException(status_code=500, detail="Internal Server Error")