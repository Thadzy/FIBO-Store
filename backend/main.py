import os
import shutil
import uuid
import json
from pydantic import Json
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List
from itertools import groupby
from typing import Optional 
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
UPLOAD_DIR = "./uploads"
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")

# --- Database Configuration ---
# Format: postgresql://user:password@host:port/database_name
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- FastAPI Initialization ---
app = FastAPI()

# --- CORS Configuration ---
# Allow requests from the frontend (Next.js running on port 3000)
origins = [
    "http://localhost:3000", 
    "https://fibo-store-ghih.vercel.app", 
    "https://fibo-store-ghih-7pdewspgv-thadzys-projects.vercel.app" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],      
    allow_headers=["*"],
)

# --- Static Files Configuration ---
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

# --- Pydantic Models ---
# Model for individual item in a booking request
# Booking Request Items
class BookingItemRequest(BaseModel):
    item_id: int
    quantity: int 

# Model for the main booking request payload
# Booking Request
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
    
    # Create new user if not found
    max_id = connection.execute(text("SELECT MAX(user_id) FROM users")).scalar() or 0
    new_id = max_id + 1

    connection.execute(text("""
        INSERT INTO users (user_id, email, full_name, role)
        VALUES (:id, :email, :name, 'Student')
    """), {"id": new_id, "email": email, "name": name})

    return new_id

# --- API Endpoints ---
# Root Endpoint
@app.get("/")
def read_root():
    """Root endpoint to check if API is running."""
    return {"message": "Welcome to FIBO Store API!"}

# @app.get("/test-db")
# def test_db_connection():
#     """Endpoint to test database connectivity."""
#     try:
#         with engine.connect() as connection:
#             result = connection.execute(text("SELECT 'Database Connected!'"))
#             return {"status": "success", "message": result.scalar()}
#     except Exception as e:
#         return {"status": "error", "message": str(e)}

# Items Endpoints 
@app.get("/items")
def read_items():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT * FROM items ORDER BY item_id DESC"))
            return [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create Item Endpoint
@app.post("/items")
async def create_item(
    name: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    quantity: int = Form(...),
    unit: str = Form("pcs"),
    specifications: Json = Form(default={}), # Specifications as JSON
    image_file: UploadFile = File(...) # Image file upload
):
    try:
        # --- Save Image File ---
        # Generate unique filename 
        file_extension = os.path.splitext(image_file.filename)[1]
        new_filename = f"{uuid.uuid4()}{file_extension}"
        file_location = os.path.join(UPLOAD_DIR, new_filename)

        # Save the uploaded file
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(image_file.file, file_object)
        
        # Construct accessible image URL
        final_image_url = f"{BASE_URL}/static/{new_filename}"
        print(f"File saved to: {file_location}, Accessible at: {final_image_url}")

        # --- Save to Database ---
        with engine.begin() as connection:

            # Prepare final specifications dictionary
            # If specifications is None, initialize as empty dict
            final_specs = specifications if specifications else {}
            
            # Add unit to specifications
            final_specs["unit"] = unit
            
            # {"rpm": "500", "voltage": "12V", "unit": "pcs"}
            connection.execute(text("""
                INSERT INTO items (name, category, description, image_url, available_quantity, specifications)
                VALUES (:name, :category, :description, :image_url, :qty, :specs)
            """), {
                "name": name,
                "category": category,
                "description": description,
                "image_url": final_image_url,
                "qty": quantity,
                "specs": json.dumps(final_specs) # Convert dict to JSON string
            })
            return {"status": "success", "message": f"Added item: {name}", "image_url": final_image_url}
            
    except Exception as e:
        print(f"Error uploading: {e}")
        # Delete the uploaded file if there was an error
        if 'file_location' in locals() and os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=str(e))

# Bookings Endpoints
@app.post("/bookings")
def create_booking(request: BookingRequest):
    try:
        with engine.begin() as connection:
            # Find user_id from email
            real_user_id = get_or_create_user(connection, request.user_email, request.user_name)

            # use real_user_id in booking creation
            booking_query = text("""
                INSERT INTO bookings (user_id, pickup_date, due_date, purpose, status)
                VALUES (:user_id, :pickup_date, :due_date, :purpose, 'Pending')
                RETURNING booking_id""")
            
            # Execute booking insertion
            result = connection.execute(booking_query, {
                "user_id" : real_user_id,
                "pickup_date": request.pickup_date,
                "due_date": request.due_date,
                "purpose": request.purpose
            })
            new_booking_id = result.scalar()
            
            # Insert each item in the booking
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

# Get My Bookings Endpoint
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

            # Group by booking_id
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

# Admin: Get All Bookings Endpoint
@app.get("/admin/bookings")
def get_all_bookings():
    # Fetch all bookings with user names and item details
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

# Update Booking Status Endpoint
@app.patch("/bookings/{booking_id}/status")
def update_booking_status(booking_id: int, update: BookingStatusUpdate):
    # Update booking status (Approve/Reject).
    # CRITICAL: Only restock items if the status is Rejected or Returned.
    try:
        with engine.begin() as connection:
            # Update the status in bookings table
            connection.execute(text("""
                UPDATE bookings SET status = :status WHERE booking_id = :id
            """), {"status": update.status, "id": booking_id})

            # Restocking Logic
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

# Delete Item Endpoint
@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    try:
        with engine.begin() as connection:
            connection.execute(text("DELETE FROM items WHERE item_id = :id"), {"id": item_id})
        return {"status": "success", "message": f"Deleted item {item_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Update Item Endpoint
@app.put("/items/{item_id}")
async def update_item(
    item_id: int,
    name: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    quantity: int = Form(...),
    unit: str = Form(...),
    specifications: Json = Form(default={}), 
    image_file: Optional[UploadFile] = File(None)
):
    try:
        # Finalize specifications
        final_specs = specifications if specifications else {}
        final_specs["unit"] = unit

        # Prepare SQL query and parameters
        sql_query = """
            UPDATE items 
            SET name=:name, category=:category, description=:description, 
                available_quantity=:qty, specifications=:specs
        """
        
        # Prepare
        params = {
            "id": item_id,
            "name": name,
            "category": category,
            "description": description,
            "qty": quantity,    
            "specs": json.dumps(final_specs) # Convert dict to JSON string
        }

        # If image file is provided, handle upload
        if image_file:
            file_extension = os.path.splitext(image_file.filename)[1]
            new_filename = f"{uuid.uuid4()}{file_extension}"
            file_location = os.path.join(UPLOAD_DIR, new_filename)
            
            with open(file_location, "wb+") as file_object:
                shutil.copyfileobj(image_file.file, file_object)
            
            new_image_url = f"{BASE_URL}/static/{new_filename}"
            
            sql_query += ", image_url=:image_url"
            params["image_url"] = new_image_url

        # End the SQL query
        sql_query += " WHERE item_id=:id"

        with engine.begin() as connection:
            connection.execute(text(sql_query), params)
            
        return {"status": "success", "message": "Updated successfully"}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))