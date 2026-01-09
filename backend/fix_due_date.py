from sqlalchemy import create_engine, text

# 👇👇 วาง Link Neon ของคุณตรงนี้ 👇👇
DATABASE_URL = "postgresql://neondb_owner:npg_Qj2svu0mEeBY@ep-bold-glitter-a1xm9uoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

if "localhost" in DATABASE_URL or "127.0.0.1" in DATABASE_URL:
    print("❌ กรุณาใส่ Link ของ Neon Cloud นะครับ (ไม่ใช่ Localhost)")
    exit()

try:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as connection:
        print("☁️ กำลังแก้ไขชื่อคอลัมน์บน Neon Cloud...")

        # พยายามเปลี่ยนชื่อจาก return_date -> due_date
        try:
            connection.execute(text("ALTER TABLE bookings RENAME COLUMN return_date TO due_date;"))
            print("✅ เปลี่ยนชื่อ 'return_date' เป็น 'due_date' สำเร็จ!")
        except Exception as e:
            print(f"⚠️ เปลี่ยนชื่อไม่สำเร็จ (อาจจะไม่มี return_date): {e}")
            
            # ถ้าเปลี่ยนไม่ได้ ให้ลองสร้าง due_date ใหม่เลย
            try:
                connection.execute(text("ALTER TABLE bookings ADD COLUMN due_date VARCHAR(50);"))
                print("✅ สร้างคอลัมน์ 'due_date' ใหม่สำเร็จ!")
            except Exception as e2:
                print(f"❌ ยังคง error อยู่: {e2}")

    print("\n🎉 Database ซ่อมเสร็จแล้ว พร้อมรับข้อมูล!")

except Exception as e:
    print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: {e}")