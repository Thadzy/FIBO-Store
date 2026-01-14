from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://neondb_owner:npg_Qj2svu0mEeBY@ep-bold-glitter-a1xm9uoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as connection:
        print("กำลังตรวจสอบและซ่อมแซมตาราง Bookings บน Neon...")

        # 1. เพิ่ม column user_email (มักจะเป็นตัวการหลักที่ทำให้ Query พัง)
        try:
            connection.execute(text("ALTER TABLE bookings ADD COLUMN user_email VARCHAR(255);"))
            print("เจาะช่อง 'user_email' สำเร็จ!")
        except Exception:
            print("ช่อง 'user_email' มีอยู่แล้ว")

        # 2. (เผื่อไว้) เพิ่ม column created_at
        try:
            connection.execute(text("ALTER TABLE bookings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
            print("✅ เจาะช่อง 'created_at' สำเร็จ!")
        except Exception:
            print("ℹ️ ช่อง 'created_at' มีอยู่แล้ว")

        print("🎉 ซ่อมแซม Database เสร็จสิ้น!")

except Exception as e:
    print(f"❌ เกิดข้อผิดพลาด: {e}")