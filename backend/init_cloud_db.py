from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://neondb_owner:npg_Qj2svu0mEeBY@ep-bold-glitter-a1xm9uoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as connection:
        print("กำลังสร้างตารางบน Neon Cloud...")
        
        # สร้างตาราง items แบบครบเครื่อง (รวม category, description, image_url แล้ว)
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS items (
                item_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) DEFAULT 'General',
                description TEXT,
                image_url TEXT,
                available_quantity INTEGER NOT NULL DEFAULT 0,
                specifications JSONB DEFAULT '{}'::jsonb
            );
        """))
        
        # สร้างตาราง bookings
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS bookings (
                booking_id SERIAL PRIMARY KEY,
                user_name VARCHAR(255),
                pickup_date VARCHAR(50),
                return_date VARCHAR(50),
                purpose TEXT,
                status VARCHAR(50) DEFAULT 'Pending'
            );
        """))

        # สร้างตาราง booking_items (เอาไว้เชื่อมของกับใบจอง)
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS booking_items (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER REFERENCES bookings(booking_id),
                item_id INTEGER REFERENCES items(item_id),
                quantity INTEGER
            );
        """))

        print("✅ สร้าง Database บน Cloud สำเร็จพร้อมใช้งาน!")

except Exception as e:
    print(f"เกิดข้อผิดพลาด: {e}")