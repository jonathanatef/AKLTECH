from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
# للسماح للفرونت إند بالتواصل مع الباك إند
CORS(app) 

# ==========================================
# إعدادات الاتصال بقاعدة البيانات الموحدة (SQL Server)
# ==========================================
def get_db_connection():
    # تم التعديل ببيانات السيرفر الخارجي الجديد
    conn_str = (
        r'DRIVER={ODBC Driver 17 for SQL Server};'
        r'SERVER=db33942.databaseasp.net,1433;'  # السيرفر والبورت
        r'DATABASE=db33942;'                    # اسم قاعدة البيانات (غالباً يكون نفس اسم المستخدم، عدله إذا لزم الأمر)
        r'UID=db33942;'                         # اسم المستخدم
        r'PWD=project2026;'                     # كلمة المرور
    )
    # ملاحظة: تم إزالة r'Trusted_Connection=yes;' لأننا نستخدم اسم مستخدم وكلمة مرور الآن
    
    conn = pyodbc.connect(conn_str)
    return conn

# مسار الصفحة الرئيسية (عشان ميظهرش 404)
@app.route('/')
def home():
    return "AKLTECH API is running successfully!"

# ==========================================
# 1. مسار تسجيل حساب جديد (Sign Up)
# ==========================================
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    # التأكد من إرسال كل البيانات
    if not all([name, email, phone, password]):
        return jsonify({'error': 'Missing required fields'}), 400

    # تشفير الباسورد
    hashed_password = generate_password_hash(password)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # التأكد إن الإيميل مش موجود قبل كده
        cursor.execute("SELECT CUSTOMER_ID FROM CUSTOMER WHERE email = ?", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already exists'}), 400

        # إدخال البيانات في جدول CUSTOMER
        insert_query = """
        INSERT INTO CUSTOMER (name, email, phone, password_hash)
        VALUES (?, ?, ?, ?)
        """
        cursor.execute(insert_query, (name, email, phone, hashed_password))
        conn.commit()
        return jsonify({'message': 'Account created successfully!'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

# ==========================================
# 2. مسار تسجيل الدخول (Login)
# ==========================================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    # تأكد إن المتغير اللي جاي من الفرونت اند اسمه email
    email = data.get('email') 
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # البحث عن المستخدم بالإيميل
        cursor.execute("SELECT CUSTOMER_ID, password_hash FROM CUSTOMER WHERE email = ?", (email,))
        user = cursor.fetchone()

        # التحقق من الباسورد
        # user[0] = CUSTOMER_ID , user[1] = password_hash
        if user and check_password_hash(user[1], password):
            return jsonify({'message': 'Login successful', 'customer_id': user[0]}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

# ==========================================
# 3. مسار المنيو (Menu)
# ==========================================
@app.route('/api/menu', methods=['GET'])
def get_menu():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # استعلام بيجيب الداتا ويربط جدول الأصناف بجدول الأقسام
        query = """
            SELECT 
                m.MENU_ITEM_ID as id, 
                m.name as name, 
                c.name as category, 
                m.price as price, 
                m.image_url as image, 
                m.description as description,
                m.is_spicy, 
                m.is_vegan, 
                m.is_healthy
            FROM MENU_ITEM m
            JOIN MENU_CATEGORY c ON m.MENU_CATEGORY_ID = c.MENU_CATEGORY_ID
            WHERE m.is_available = 1
        """
        cursor.execute(query)
        
        # تحويل النتيجة لـ Dictionary (عشان pyodbc مش بيدعم dictionary=True)
        columns = [column[0] for column in cursor.description]
        items = [dict(zip(columns, row)) for row in cursor.fetchall()]

        # تجميع الـ tags وتحويل أنواع البيانات
        for item in items:
            tags = []
            if item.get('is_spicy'): tags.append("spicy")
            if item.get('is_vegan'): tags.append("vegan")
            if item.get('is_healthy'): tags.append("healthy")
            item['tags'] = tags
            
            # تحويل السعر لـ float عشان مايعملش مشكلة في الـ JSON
            item['price'] = float(item['price']) if item['price'] is not None else 0.0

        return jsonify(items)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    # تشغيل السيرفر
    app.run(debug=True, port=5000)