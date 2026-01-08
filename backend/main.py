from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List
from itertools import groupby

# --- Database Configuration ---
# Format: postgresql://user:password@host:port/database_name
DATABASE_URL = "postgresql://admin:admin12345678@localhost:5432/fibo_store_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- FastAPI Initialization ---
app = FastAPI()

# --- CORS Configuration ---
# Allow requests from the frontend (Next.js running on port 3000)
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

# --- Data Models (Pydantic Schemas) ---

# Model for individual items within a booking request
class BookingItemRequest(BaseModel):
    item_id: int
    quantity: int 

# Model for the main booking request payload
class BookingRequest(BaseModel):
    user_id: int = 1  # Default value for now
    pickup_date: str
    due_date: str
    purpose: str
    items: List[BookingItemRequest]

# Model for updating booking status (used by Admin)
class BookingStatusUpdate(BaseModel):
    status: str

# --- API Endpoints ---

@app.get("/")
def read_root():
    """Root endpoint to check if API is running."""
    return {"message": "Welcome to FIBO Store API! 🚀"}

@app.get("/test-db")
def test_db_connection():
    """Endpoint to test database connectivity."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 'Database Connected!'"))
            return {"status": "success", "message": result.scalar()}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
@app.get("/items")
def read_items():
    """Fetch all available items from the database."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM items ORDER BY item_id"))
            items = [dict(row._mapping) for row in result]
            return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/bookings")
def create_booking(request: BookingRequest):
    """
    Create a new booking.
    Transaction:
    1. Insert booking record.
    2. Check stock for each item.
    3. Deduct stock.
    4. Insert booking items.
    """
    try:
        # Use engine.begin() for atomic transaction (auto-rollback on error)
        with engine.begin() as connection:
            # 1. Insert into bookings table
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
            
            # 2. Loop through requested items
            for item in request.items:
                # Check current stock availability
                check_stock = connection.execute(
                    text("SELECT available_quantity FROM items WHERE item_id = :item_id"),
                    {"item_id": item.item_id}
                ).scalar()

                if check_stock is None:
                    raise HTTPException(status_code=404, detail=f"Item ID {item.item_id} not found.")
                
                if check_stock < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for Item ID {item.item_id}.")
                
                # 3. Insert into booking_items table
                connection.execute(text("""
                    INSERT INTO booking_items (booking_id, item_id, quantity)
                    VALUES (:booking_id, :item_id, :quantity)"""), {
                        "booking_id": new_booking_id,
                        "item_id": item.item_id,
                        "quantity": item.quantity
                    })
                
                # 4. Deduct stock from items table
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
        # Re-raise HTTP exceptions (like 400 or 404)
        raise he
    except Exception as e:
        print(f"Error: {e}") 
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@app.get("/my-bookings/{user_id}")
def get_my_bookings(user_id: int):
    """Fetch booking history for a specific user."""
    try:
        with engine.connect() as connection:
            # Join tables to get full details (Booking + Items + Item Names)
            query = text("""
                SELECT 
                    b.booking_id, 
                    b.status, 
                    b.pickup_date, 
                    b.due_date,
                    b.purpose,
                    i.name as item_name,
                    bi.quantity
                FROM bookings b
                JOIN booking_items bi ON b.booking_id = bi.booking_id
                JOIN items i ON bi.item_id = i.item_id
                WHERE b.user_id = :uid
                ORDER BY b.booking_id DESC
            """)
            result = connection.execute(query, {"uid": user_id})
            rows = [dict(row._mapping) for row in result]

            history_list = []

            # Group rows by booking_id to form a nested JSON structure
            for booking_id, group in groupby(rows, key=lambda x: x['booking_id']):
                group_items = list(group)
                first_row = group_items[0]

                history_list.append({
                    "booking_id": booking_id,
                    "status": first_row['status'],
                    "pickup_date": first_row['pickup_date'],
                    "return_date": first_row['due_date'],
                    "purpose": first_row['purpose'],
                    "items": [
                        {"name": item['item_name'], "quantity": item['quantity']} 
                        for item in group_items
                    ]
                })

            return history_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/bookings")
def get_all_bookings():
    """Fetch ALL bookings for the Admin Dashboard."""
    try:
        with engine.connect() as connection:
            query = text("""
                SELECT 
                    b.booking_id, b.status, b.pickup_date, b.due_date, b.purpose,
                    u.full_name as user_name,
                    i.name as item_name, bi.quantity
                FROM bookings b
                JOIN users u ON b.user_id = u.user_id
                JOIN booking_items bi ON b.booking_id = bi.booking_id
                JOIN items i ON bi.item_id = i.item_id
                ORDER BY b.booking_id DESC
            """)
            result = connection.execute(query)
            rows = [dict(row._mapping) for row in result]

            admin_bookings = []
            # Group by booking_id
            for booking_id, group in groupby(rows, key=lambda x: x['booking_id']):
                group_items = list(group)
                first_row = group_items[0]

                admin_bookings.append({
                    "booking_id": booking_id,
                    "status": first_row['status'],
                    "pickup_date": first_row['pickup_date'],
                    "return_date": first_row['due_date'],
                    "purpose": first_row['purpose'],
                    "user_name": first_row['user_name'],
                    "items": [
                        {"name": item['item_name'], "quantity": item['quantity']} 
                        for item in group_items
                    ]
                })
            return admin_bookings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/bookings/{booking_id}/status")
def update_booking_status(booking_id: int, update: BookingStatusUpdate):
    """
    Update booking status (Approve/Reject).
    CRITICAL: Only restock items if the status is Rejected or Returned.
    """
    try:
        with engine.begin() as connection:
            # 1. Update the status in bookings table
            connection.execute(text("""
                UPDATE bookings SET status = :status WHERE booking_id = :id
            """), {"status": update.status, "id": booking_id})

            # 2. Restocking Logic
            if update.status in ["Rejected", "Returned"]:
                
                # Fetch items associated with this booking
                items_result = connection.execute(text("""
                    SELECT item_id, quantity FROM booking_items WHERE booking_id = :id
                """), {"id": booking_id})
                items_in_booking = [dict(row._mapping) for row in items_result]

                # Loop and add quantity back to inventory
                for item in items_in_booking:
                    connection.execute(text("""
                        UPDATE items
                        SET available_quantity = available_quantity + :quantity
                        WHERE item_id = :item_id
                    """), {
                        "quantity": item["quantity"],
                        "item_id": item["item_id"]
                    })

            return {"message": f"Booking {booking_id} updated to {update.status}"}
    except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))