// login.js

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

// للموبايل
const signUpMobileLink = document.getElementById('signUpMobile');
const signInMobileLink = document.getElementById('signInMobile');

// حركات الأنيميشن للتنقل بين الدخول والتسجيل
if(signUpButton) {
    signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
}
if(signInButton) {
    signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));
}
if(signUpMobileLink){
    signUpMobileLink.addEventListener('click', () => container.classList.add("right-panel-active"));
}
if(signInMobileLink){
    signInMobileLink.addEventListener('click', () => container.classList.remove("right-panel-active"));
}

// ==========================================
// 🔴 دالة التوجيه بعد تسجيل الدخول الناجح
// ==========================================
function performLoginRedirect() {
    // 1. نجيب الوضع اللي اختاره المستخدم في الصفحة الرئيسية
    const mode = localStorage.getItem('diningMode');

    // 2. لو كان حجز أو دليفري -> نوديه المنيو يكمل طلبه
    if (mode === "reservation" || mode === "delivery") {
        window.location.href = "../product/menu.html";
    } 
    // لو دخل بشكل مباشر أو أي حالة أخرى -> ممكن نوديه الصفحة الرئيسية أو المنيو برضه حسب رغبتك
    else {
        window.location.href = "../product/menu.html"; 
    }
}

// ==========================================
// 🔴 ربط الباك إند (Flask API)
// ==========================================
const API_BASE_URL = 'http://127.0.0.1:5000/api'; // رابط سيرفر Flask

// التعامل مع زر Sign Up
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // تجميع البيانات من الفورم باستخدام الـ IDs اللي ضفناها
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message); // هيعرض: Account created successfully!
            performLoginRedirect(); // توجيه المستخدم بعد نجاح التسجيل
        } else {
            alert('Error: ' + data.error); // هيعرض رسالة الخطأ لو الإيميل متسجل قبل كده
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please make sure the Flask server is running.');
    }
});

// التعامل مع زر Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // تجميع البيانات
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Welcome Back!');
            // حفظ رقم تعريف العميل (ID) في المتصفح عشان نستخدمه وقت عمل الأوردر
            localStorage.setItem('customerId', data.customer_id); 
            performLoginRedirect();
        } else {
            alert('Error: ' + data.error); // لو الباسورد أو الإيميل غلط
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please make sure the Flask server is running.');
    }
});