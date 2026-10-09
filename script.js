// ===== PRODUCT DATA (with localStorage fallback) =====
const DEFAULT_PRODUCTS = [
{
  id: 1,
  name: 'Wireless Noise-Cancelling Headphones',
  category: 'electronics',
  price: 149.99,
  rating: 4.8,
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop&crop=center&auto=format',
  description: 'Premium over-ear headphones with active noise cancellation and 30-hour battery life.'
},
{
  id: 2,
  name: 'Slim Fit Cotton T-Shirt',
  category: 'clothing',
  price: 24.99,
  rating: 4.3,
  image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop&crop=center&auto=format',
  description: 'Comfortable 100% organic cotton t-shirt with a modern slim fit.'
},
{
  id: 3,
  name: 'Modern Ceramic Table Lamp',
  category: 'home',
  price: 59.99,
  rating: 4.6,
  image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&h=200&fit=crop&crop=center&auto=format',
  description: 'Elegant ceramic lamp with warm LED glow — perfect for any living space.'
},
{
  id: 4,
  name: 'Hydrating Facial Serum',
  category: 'beauty',
  price: 39.99,
  rating: 4.7,
  image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop&crop=center&auto=format',
  description: 'Vitamin C and hyaluronic acid serum for radiant, hydrated skin.'
},
{
  id: 5,
  name: 'Smart Fitness Watch',
  category: 'electronics',
  price: 199.99,
  rating: 4.9,
  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop&crop=center&auto=format',
  description: 'Track your heart rate, sleep, and workouts with this advanced smartwatch.'
},
{
  id: 6,
  name: 'Classic Denim Jacket',
  category: 'clothing',
  price: 79.99,
  rating: 4.4,
  image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=200&h=200&fit=crop&crop=center&auto=format',
  description: 'Timeless denim jacket with a relaxed fit and durable fabric.'
},
{
  id: 7,
  name: 'Aromatherapy Diffuser',
  category: 'home',
  price: 34.99,
  rating: 4.2,
  image: 'https://images.unsplash.com/photo-1587918842454-870dbd18261a?w=200&h=200&fit=crop&crop=center&auto=format',
  description: 'Ultrasonic essential oil diffuser with color-changing LED lights.'
},
{
  id: 8,
  name: 'Organic Rosewater Toner',
  category: 'beauty',
  price: 18.99,
  rating: 4.5,
  image: 'https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=200&h=200&fit=crop&crop=center&auto=format',
  description: 'Pure rosewater toner to balance and refresh your skin.'
}];

// Load products from localStorage or use defaults
let products = [];

function loadProducts() {
  const stored = localStorage.getItem('shopverse_products');
  if (stored) {
    try {
      products = JSON.parse(stored);
    } catch (e) {
      products = [...DEFAULT_PRODUCTS];
    }
  } else {
    products = [...DEFAULT_PRODUCTS];
  }
  products.forEach(p => { if (!p.id) p.id = Date.now() + Math.random(); });
  saveProducts();
}

function saveProducts() {
  localStorage.setItem('shopverse_products', JSON.stringify(products));
}

// ===== STATE =====
let cart = [];
let currentCategory = 'all';
let searchQuery = '';

// ===== DOM REFS =====
const productGrid = document.getElementById('productGrid');
const productCount = document.getElementById('productCount');
const cartBadge = document.getElementById('cartBadge');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const cartFooter = document.getElementById('cartFooter');
const toast = document.getElementById('toast');

// Admin refs (may be null if not added)
const adminModal = document.getElementById('adminModal');
const adminOverlay = document.getElementById('adminOverlay');
const adminClose = document.getElementById('adminClose');
const adminToggle = document.getElementById('adminToggle');
const adminProductList = document.getElementById('adminProductList');
const addProductForm = document.getElementById('addProductForm');

// ===== RENDER PRODUCTS =====
function renderProducts() {
  let filtered = products;
  
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }
  
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }
  
  productCount.textContent = `${filtered.length} items`;
  
  if (filtered.length === 0) {
    productGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem 0; color:#8888a0;">
        <i class="fas fa-search" style="font-size:2rem; display:block; margin-bottom:1rem;"></i>
        No products found.
      </div>
    `;
    return;
  }
  
  productGrid.innerHTML = filtered.map(product => `
    <div class="product-card" data-id="${product.id}">
      <div class="product-card__image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${product.category}</span>
        <h3 class="product-card__title">${product.name}</h3>
        <div class="product-card__rating">
          ${'★'.repeat(Math.floor(product.rating))}${product.rating % 1 >= 0.5 ? '★' : ''}
          <span style="color:#8888a0; font-weight:400;">(${product.rating})</span>
        </div>
        <div class="product-card__price">$${product.price.toFixed(2)}</div>
        <button class="product-card__add" data-id="${product.id}">
          <i class="fas fa-plus"></i> Add to Cart
        </button>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('.product-card__add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      addToCart(id);
    });
  });
}

// ===== CART LOGIC =====
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCartUI();
  showToast(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    updateCartUI();
  }
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartUI() {
  const count = getCartItemCount();
  cartBadge.textContent = count;
  if (cart.length === 0) {
    cartItems.innerHTML = '';
    cartEmpty.style.display = 'block';
    cartFooter.style.display = 'none';
  } else {
    cartEmpty.style.display = 'none';
    cartFooter.style.display = 'block';
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item__image">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="cart-item__info">
          <div class="cart-item__title">${item.name}</div>
          <div class="cart-item__price">$${item.price.toFixed(2)}</div>
          <div class="cart-item__qty">
            <button data-id="${item.id}" data-delta="-1">−</button>
            <span>${item.qty}</span>
            <button data-id="${item.id}" data-delta="1">+</button>
          </div>
        </div>
        <button class="cart-item__remove" data-id="${item.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `).join('');
    document.querySelectorAll('.cart-item__qty button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const delta = Number(btn.dataset.delta);
        updateQty(id, delta);
      });
    });
    document.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        removeFromCart(id);
        showToast('Item removed from cart.');
      });
    });
  }
  cartTotalPrice.textContent = `$${getCartTotal().toFixed(2)}`;
}

// ===== TOAST =====
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ===== CART SIDEBAR =====
function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.getElementById('cartContinueShopping').addEventListener('click', closeCart);

// ===== MOBILE MENU =====
const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');
menuToggle.addEventListener('click', () => {
  mobileNav.classList.toggle('open');
  const icon = menuToggle.querySelector('i');
  icon.className = mobileNav.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
});
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuToggle.querySelector('i').className = 'fas fa-bars';
  });
});

// ===== CATEGORY FILTERING =====
function setActiveCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.header__nav-list a, .header__mobile-nav a, .footer__links a[data-category]').forEach(link => {
    link.classList.toggle('active', link.dataset.category === category);
  });
  document.querySelectorAll('.pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.category === category);
  });
  renderProducts();
}
document.querySelectorAll('.header__nav-list a, .header__mobile-nav a, .footer__links a[data-category], .pill').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const category = el.dataset.category;
    if (category) setActiveCategory(category);
    if (mobileNav.classList.contains('open')) {
      mobileNav.classList.remove('open');
      menuToggle.querySelector('i').className = 'fas fa-bars';
    }
  });
});

// ===== SEARCH =====
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

function performSearch() {
  searchQuery = searchInput.value;
  renderProducts();
}
searchInput.addEventListener('input', performSearch);
searchBtn.addEventListener('click', performSearch);

// ===== CHECKOUT =====
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Your cart is empty!');
    return;
  }
  showToast('Order placed successfully! 🎉');
  cart = [];
  updateCartUI();
  closeCart();
});

// ===== ADMIN PANEL (only if elements exist) =====
if (adminToggle && adminModal && adminOverlay && adminClose) {
  function openAdmin() {
    adminModal.classList.add('open');
    adminOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (adminProductList) renderAdminProductList();
  }
  
  function closeAdmin() {
    adminModal.classList.remove('open');
    adminOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  adminToggle.addEventListener('click', openAdmin);
  adminClose.addEventListener('click', closeAdmin);
  adminOverlay.addEventListener('click', closeAdmin);
  
  function renderAdminProductList() {
    adminProductList.innerHTML = products.map(p => `
      <div class="admin-product-item" data-id="${p.id}">
        <div class="admin-product-info">
          <strong>${p.name}</strong>
          <span class="admin-product-category">${p.category}</span>
        </div>
        <div class="admin-product-edits">
          <label>Price $<input type="number" step="0.01" class="admin-edit-price" value="${p.price}" data-id="${p.id}" /></label>
          <label>Image URL <input type="text" class="admin-edit-image" value="${p.image}" data-id="${p.id}" /></label>
          <button class="admin-delete-btn" data-id="${p.id}"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
      </div>
    `).join('');
    
    document.querySelectorAll('.admin-edit-price').forEach(input => {
      input.addEventListener('change', function() {
        const id = Number(this.dataset.id);
        const newPrice = parseFloat(this.value);
        if (!isNaN(newPrice) && newPrice >= 0) {
          const product = products.find(p => p.id === id);
          if (product) {
            product.price = newPrice;
            saveProducts();
            renderProducts();
            showToast('Price updated!');
          }
        }
      });
    });
    
    document.querySelectorAll('.admin-edit-image').forEach(input => {
      input.addEventListener('change', function() {
        const id = Number(this.dataset.id);
        const newImage = this.value.trim();
        if (newImage) {
          const product = products.find(p => p.id === id);
          if (product) {
            product.image = newImage;
            saveProducts();
            renderProducts();
            showToast('Image updated!');
          }
        }
      });
    });
    
    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = Number(this.dataset.id);
        if (confirm('Delete this product?')) {
          products = products.filter(p => p.id !== id);
          saveProducts();
          renderProducts();
          renderAdminProductList();
          showToast('Product deleted.');
        }
      });
    });
  }
  
  // Add product form
  if (addProductForm) {
    addProductForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('addName').value.trim();
      const category = document.getElementById('addCategory').value;
      const price = parseFloat(document.getElementById('addPrice').value);
      const rating = parseFloat(document.getElementById('addRating').value);
      const image = document.getElementById('addImage').value.trim();
      const description = document.getElementById('addDescription').value.trim();
      
      if (!name || !category || isNaN(price) || isNaN(rating) || !image || !description) {
        showToast('Please fill all fields correctly.');
        return;
      }
      
      const newProduct = {
        id: Date.now() + Math.random(),
        name,
        category,
        price,
        rating: Math.min(5, Math.max(0, rating)),
        image,
        description
      };
      products.push(newProduct);
      saveProducts();
      renderProducts();
      if (adminProductList) renderAdminProductList();
      addProductForm.reset();
      showToast('Product added successfully!');
    });
  }
}

// ===== INIT =====
loadProducts();
renderProducts();
updateCartUI();

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCart();
    if (adminModal && adminModal.classList.contains('open')) closeAdmin();
  }
});