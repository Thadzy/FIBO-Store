from sqlalchemy import create_engine, text

# ⚠️ อย่าลืมใส่ Link Neon ของคุณตรงนี้
DATABASE_URL = "postgresql://neondb_owner:npg_Qj2svu0mEeBY@ep-bold-glitter-a1xm9uoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as connection:
        print("☁️ กำลังสร้างตาราง Users บน Neon...")

        # 1. สร้างตาราง users (ถ้ายังไม่มี)
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'Student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        print("✅ สร้างตาราง 'users' สำเร็จ!")

        # 2. เพิ่ม column user_id ในตาราง bookings (เพื่อผูกว่าใครจอง)
        # เราจะเช็คก่อนว่ามีไหม ถ้าไม่มีค่อยเพิ่ม
        try:
            connection.execute(text("ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(user_id);"))
            print("✅ เชื่อมตาราง bookings -> users สำเร็จ!")
        except Exception as e:
            print(f"ℹ️ ตาราง bookings อาจจะมี user_id อยู่แล้ว: {e}")

        # 3. (แถม) เพิ่ม column user_email ใน bookings ด้วย (เผื่อโค้ดรุ่นเก่าเรียกใช้)
        try:
            connection.execute(text("ALTER TABLE bookings ADD COLUMN user_email VARCHAR(255);"))
            print("✅ เพิ่ม column 'user_email' สำเร็จ!")
        except Exception:
            pass

        print("🎉 ฐานข้อมูลพร้อมสำหรับการยืมแล้ว!")

except Exception as e:
    print(f"❌ เกิดข้อผิดพลาด: {e}")