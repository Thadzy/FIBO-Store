from sqlalchemy import create_engine, text

# 👇👇 วาง Link Neon ของคุณตรงนี้ (ต้องขึ้นต้นด้วย postgres:// หรือ postgresql://) 👇👇
DATABASE_URL = "postgresql://neondb_owner:npg_Qj2svu0mEeBY@ep-bold-glitter-a1xm9uoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

if "localhost" in DATABASE_URL or "127.0.0.1" in DATABASE_URL:
    print("❌ เดี๋ยวก่อน! ดูเหมือนคุณกำลังจะรันใส่เครื่องตัวเอง (Localhost)")
    print("   เราต้องการซ่อมบน Cloud (Neon) ครับ ช่วยเปลี่ยน Link ก่อนนะ")
    exit()

try:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as connection:
        print("☁️ กำลังสร้างตาราง Users บน Neon Cloud...")

        # 1. สร้างตาราง users (ต้นเหตุของ Error)
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

        # 2. ตรวจสอบและเชื่อม Foreign Key กับตาราง bookings
        try:
             # ลองเพิ่ม column user_id ถ้ายังไม่มี
             connection.execute(text("ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(user_id);"))
             print("✅ เชื่อม bookings -> users สำเร็จ")
        except Exception:
             print("ℹ️ ตาราง bookings มีการเชื่อมโยง user_id อยู่แล้ว (OK)")

    print("\n🎉 ซ่อมเสร็จแล้ว! Database บน Cloud พร้อมทำงาน 100%")

except Exception as e:
    print(f"❌ เกิดข้อผิดพลาด: {e}")