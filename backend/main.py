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
    user_email: str 
    user_name: str
    pickup_date: str
    due_date: str
    purpose: str
    items: List[BookingItemRequest]

# Model for updating booking status (used by Admin)
class BookingStatusUpdate(BaseModel):
    status: str

# --- Helper Function ---
def get_or_create_user(connection, email:str, name: str):
    user = connection.execute(
        text("SELECT user_id FROM users WHERE email = :email"), {"email": email}
    ).fetchone()

    if user:
        return user.user_id
    
    max_id = connection.execute(text("SELECT MAX(user_id) FROM users")).scalar() or 0
    new_id = max_id + 1

    connection.execute(text("""
        INSERT INTO users (user_id, email, full_name, role)
        VALUES (:id, :email, :name, 'Student')
    """), {"id": new_id, "email": email, "name": name})

    return new_id

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
    try:
        with engine.begin() as connection:
            # 1. หา User ID จริงๆ จาก Email
            real_user_id = get_or_create_user(connection, request.user_email, request.user_name)

            # 2. สร้างใบจอง (ใช้ real_user_id)
            booking_query = text("""
                INSERT INTO bookings (user_id, pickup_date, due_date, purpose, status)
                VALUES (:user_id, :pickup_date, :due_date, :purpose, 'Pending')
                RETURNING booking_id""")
            
            result = connection.execute(booking_query, {
                "user_id" : real_user_id,
                "pickup_date": request.pickup_date,
                "due_date": request.due_date,
                "purpose": request.purpose
            })
            new_booking_id = result.scalar()
            
            # 3. จัดการ Items (เหมือนเดิม)
            for item in request.items:
                check_stock = connection.execute(
                    text("SELECT available_quantity FROM items WHERE item_id = :item_id"),
                    {"item_id": item.item_id}
                ).scalar()

                if check_stock is None:
                    raise HTTPException(status_code=404, detail=f"Item {item.item_id} not found")
                if check_stock < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Item {item.item_id} out of stock")
                
                connection.execute(text("""
                    INSERT INTO booking_items (booking_id, item_id, quantity)
                    VALUES (:booking_id, :item_id, :quantity)"""), 
                    {"booking_id": new_booking_id, "item_id": item.item_id, "quantity": item.quantity})
                
                connection.execute(text("""
                    UPDATE items SET available_quantity = available_quantity - :quantity
                    WHERE item_id = :item_id"""), 
                    {"quantity": item.quantity, "item_id": item.item_id})
            
            return {"status": "success", "booking_id": new_booking_id}        
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@app.get("/my-bookings")
def get_my_bookings(email: str):
    try:
        with engine.connect() as connection:
            query = text("""
                SELECT b.booking_id, b.status, b.pickup_date, b.due_date, b.purpose,
                       i.name as item_name, bi.quantity
                FROM bookings b
                JOIN users u ON b.user_id = u.user_id  
                JOIN booking_items bi ON b.booking_id = bi.booking_id
                JOIN items i ON bi.item_id = i.item_id
                WHERE u.email = :email
                ORDER BY b.booking_id DESC
            """)
            result = connection.execute(query, {"email": email})
            rows = [dict(row._mapping) for row in result]

            history_list = []
            for booking_id, group in groupby(rows, key=lambda x: x['booking_id']):
                group_items = list(group)
                first = group_items[0]
                history_list.append({
                    "booking_id": booking_id,
                    "status": first['status'],
                    "pickup_date": first['pickup_date'],
                    "return_date": first['due_date'],
                    "purpose": first['purpose'],
                    "items": [{"name": i['item_name'], "quantity": i['quantity']} for i in group_items]
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