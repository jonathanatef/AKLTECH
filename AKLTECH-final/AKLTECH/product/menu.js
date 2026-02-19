// ===== DYNAMIC DATA (Menu Items) =====
let menuItems = []; // الداتا هتيجي من الـ Database

// ===== FETCH MENU FROM FLASK BACKEND =====
async function fetchMenuItems() {
    try {
        // تأكد إن الرابط ده هو نفس رابط الـ Flask API بتاعك
        const response = await fetch('http://127.0.0.1:5000/api/menu');
        if (!response.ok) throw new Error('Network response was not ok');
        
        menuItems = await response.json();
        
        // رسم المنيو بعد ما البيانات توصل بنجاح
        renderMenu(); 
    } catch (error) {
        console.error("Error fetching menu:", error);
        document.getElementById('menu-grid').innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1;">عذراً، لم نتمكن من تحميل قائمة الطعام. تأكد من تشغيل السيرفر.</p>';
    }
}

// ===== RENDER MENU =====
const menuGrid = document.getElementById('menu-grid');

function renderMenu(filter = 'all') {
    menuGrid.innerHTML = ''; // Clear current items
    
    // فلترة بناءً على الـ Category Name اللي راجع من الداتابيز
    const filteredItems = filter === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === filter);

    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('menu-card');
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="card-info">
                <h3>${item.name}</h3>
                <p>${item.description || 'No description available.'}</p>
                <div class="price-row">
                    <span class="price">$${Number(item.price).toFixed(2)}</span>
                    <button class="add-btn" onclick="addToCart(${item.id})">
                        + Add
                    </button>
                </div>
            </div>
        `;
        menuGrid.appendChild(card);
    });
}

// Handle Category Tabs Styling
const tabs = document.querySelectorAll('.tab-btn');
tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});

// استدعاء الدالة لجلب البيانات عند تحميل الصفحة
fetchMenuItems();

// ===== FILTER FUNCTION =====
function filterMenu(category) {
    renderMenu(category);
}

// ===== CART LOGIC =====
let cart = [];

function addToCart(id) {
    const item = menuItems.find(i => i.id === id);
    const existingItem = cart.find(i => i.id === id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
    } else {
        cart.forEach(item => {
            total += item.price * item.quantity;
            count += item.quantity;
            
            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60'">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>$${Number(item.price).toFixed(2)}</p>
                    <div class="cart-controls">
                        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                        <i class="fa-solid fa-trash remove-btn" onclick="removeItem(${item.id})"></i>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
    }

    totalEl.innerText = `$${total.toFixed(2)}`;
    countEl.innerText = count;
}

function changeQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeItem(id);
        } else {
            updateCartUI();
        }
    }
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

function toggleCart(forceOpen = false) {
    const sidebar = document.getElementById('cart-sidebar');
    if (forceOpen) {
        sidebar.classList.add('open');
    } else {
        sidebar.classList.toggle('open');
    }
}

function selectDiningMode(mode) {
    localStorage.setItem("serviceType", mode);
    console.log("Selected service:", mode);
}

function proceedToTable() {
    if (cart.length === 0) {
        alert("Your cart is empty! Add some delicious food first.");
        return;
    }

    localStorage.setItem('cartItems', JSON.stringify(cart));
    const mode = localStorage.getItem("diningMode"); 
    console.log("Dining Mode:", mode);

    if (mode === "reservation" || mode === "dine_in") {
        window.location.href = "../tablereservation/tablereservation.html";
    } else {
        window.location.href = "../checkout/checkout.html";
    }
}


// ===== AI RECOMMENDATION LOGIC =====
const modal = document.getElementById('ai-modal');
const questionText = document.getElementById('ai-question-text');
const optionsContainer = document.getElementById('ai-options');

let aiStep = 0;
let userPreferences = {};

function startAIFlow() {
    modal.style.display = "block";
    aiStep = 1;
    askQuestion();
}

function closeAIModal() {
    modal.style.display = "none";
}

function askQuestion() {
    optionsContainer.innerHTML = ''; 

    if (aiStep === 1) {
        // تم التعديل بناءً على حقول is_vegan و is_healthy في قاعدة البيانات
        questionText.innerText = "Do you have any dietary preferences?";
        createOptionBtn("Vegan", "vegan");
        createOptionBtn("Healthy / Low Calorie", "healthy");
        createOptionBtn("No Preference", "none");
    } else if (aiStep === 2) {
        // تم التعديل بناءً على حقل is_spicy في قاعدة البيانات
        questionText.innerText = "How do you like your food?";
        createOptionBtn("Spicy", "spicy");
        createOptionBtn("Mild", "mild");
    } else {
        showRecommendation();
    }
}

function createOptionBtn(text, value) {
    const btn = document.createElement('button');
    btn.classList.add('ai-option-btn');
    btn.innerText = text;
    btn.onclick = () => {
        if (aiStep === 1) userPreferences.diet = value;
        if (aiStep === 2) userPreferences.spice = value;
        aiStep++;
        askQuestion();
    };
    optionsContainer.appendChild(btn);
}

function showRecommendation() {
    // فلترة الأطباق بناءً على الـ tags المجمعة من قاعدة البيانات (spicy, vegan, healthy)
    let recommendation = menuItems.find(item => {
        if (!item.tags) return false;
        return item.tags.includes(userPreferences.diet) || item.tags.includes(userPreferences.spice);
    });

    // لو ملقاش حاجة بالظبط، بيعرض أول صنف متاح كبديل
    if (!recommendation && menuItems.length > 0) {
        recommendation = menuItems[0]; 
    }

    if (recommendation) {
        questionText.innerText = `We recommend: ${recommendation.name}!`;
        optionsContainer.innerHTML = `
            <div style="grid-column: span 2; text-align: center;">
                <img src="${recommendation.image}" onerror="this.src='https://via.placeholder.com/100'" style="width: 100px; height: 100px; object-fit: cover; border-radius: 10px; margin-bottom: 10px;">
                <p>${recommendation.description || ''}</p>
                <button class="ai-btn" style="margin-top: 10px;" onclick="addRecToCart(${recommendation.id})">Add to Cart</button>
            </div>
        `;
    } else {
        questionText.innerText = "Menu is currently updating. Please check back soon!";
    }
}

function addRecToCart(id) {
    addToCart(id);
    closeAIModal();
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeAIModal();
    }
}