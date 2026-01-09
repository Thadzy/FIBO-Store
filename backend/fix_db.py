from sqlalchemy import create_engine, text, inspect

# URL Database ของคุณ
DATABASE_URL = "postgresql://admin:admin12345678@localhost:5432/fibo_store_db"
engine = create_engine(DATABASE_URL)

def fix_missing_columns():
    print("🔍 กำลังตรวจเช็ค Database รอบสุดท้าย...")
    
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('items')]
    print(f"📊 ช่องที่มีอยู่ตอนนี้: {columns}")

    with engine.connect() as connection:
        # 1. เช็คช่อง Description (ตัวการ Error ล่าสุด)
        if 'description' not in columns:
            print("⚠️ ไม่พบช่อง 'description' -> กำลังเจาะช่องเพิ่ม...")
            with connection.begin():
                connection.execute(text("ALTER TABLE items ADD COLUMN description TEXT;"))
            print("✅ เพิ่ม 'description' สำเร็จ!")
        else:
            print("✅ ช่อง 'description' มีอยู่แล้ว")

        # 2. เช็คช่อง Specifications (เช็คเผื่อไว้เลย จะได้ไม่ Error อีก)
        if 'specifications' not in columns:
            print("⚠️ ไม่พบช่อง 'specifications' -> กำลังเจาะช่องเพิ่ม...")
            with connection.begin():
                # เพิ่มช่อง JSON สำหรับเก็บพวก unit, color ฯลฯ
                connection.execute(text("ALTER TABLE items ADD COLUMN specifications JSONB DEFAULT '{}'::jsonb;"))
            print("✅ เพิ่ม 'specifications' สำเร็จ!")
        else:
            print("✅ ช่อง 'specifications' มีอยู่แล้ว")

    print("\n🎉 Database สมบูรณ์พร้อมรับข้อมูลแล้วครับ!")

if __name__ == "__main__":
    fix_missing_columns()