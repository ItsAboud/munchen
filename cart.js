// تحميل السلة من التخزين المحلي
let cart = JSON.parse(localStorage.getItem('munchen-cart') || '[]');
const cartFab = document.getElementById('cart-fab');
const cartSidebar = document.getElementById('cart-sidebar');
const cartClose = document.getElementById('cart-close');
const cartItemsDiv = document.getElementById('cart-items');
const cartTotalDiv = document.getElementById('cart-total');
const cartPayBtn = document.getElementById('cart-pay-btn');
const cartCount = document.getElementById('cart-count');

// حفظ السلة في التخزين المحلي
function saveCart() {
  localStorage.setItem('munchen-cart', JSON.stringify(cart));
}

function updateCartCount() {
  if (cart.length > 0) {
    cartCount.textContent = cart.length;
    cartCount.style.display = 'flex';
  } else {
    cartCount.style.display = 'none';
  }
}

function renderCart() {
  if (cart.length === 0) {
    cartItemsDiv.innerHTML = `
      <div style="color:#b9bbbe;text-align:center;padding:2rem 1rem;font-size:1.1rem;">
        <i class="fas fa-shopping-cart" style="font-size:3rem;color:#36393f;margin-bottom:1rem;display:block;"></i>
        سلة المشتريات فارغة
        <div style="font-size:0.9rem;margin-top:0.5rem;opacity:0.7;">أضف بعض المنتجات لتبدأ التسوق</div>
      </div>
    `;
  } else {
    cartItemsDiv.innerHTML = cart.map((item, i) => `
      <div class="cart-item" data-item-index="${i}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">$${item.price}</div>
        </div>
        <button class="cart-remove" title="حذف من السلة" onclick="window.cartRemove(${i})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  const total = cart.reduce((sum, item) => sum + Number(item.price), 0);
  cartTotalDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span>الإجمالي:</span>
      <span style='color:#57f287;font-size:1.2rem;text-shadow:0 1px 3px rgba(87,242,135,0.3);'>$${total}</span>
    </div>
  `;

  cartPayBtn.disabled = cart.length === 0;
  cartPayBtn.style.opacity = cart.length === 0 ? 0.6 : 1;
  cartPayBtn.style.cursor = cart.length === 0 ? 'not-allowed' : 'pointer';
  updateCartCount();
}

window.cartAdd = function(item) {
  // التحقق من وجود المنتج مسبقاً
  const existingItem = cart.find(cartItem =>
    cartItem.title === item.title && cartItem.type === item.type
  );

  if (existingItem) {
    showAddToCartNotification(`"${item.title}" موجود بالفعل في السلة`, 'warning');
    return;
  }

  // إضافة المنتج للسلة
  cart.push(item);
  saveCart();

  // تأثير نبضة على زر السلة
  cartFab.classList.add('pulse');
  setTimeout(() => cartFab.classList.remove('pulse'), 600);

  // تحديث السلة وفتحها
  renderCart();
  cartSidebar.classList.add('open');
  showCartFab(false);

  // إشعار بصري
  showAddToCartNotification(`تم إضافة "${item.title}" للسلة`, 'success');
};

window.cartRemove = function(idx) {
  const removedItem = cart[idx];

  // تأثير انزلاق للعنصر المحذوف
  const itemElement = document.querySelector(`[data-item-index="${idx}"]`);
  if (itemElement) {
    itemElement.style.transform = 'translateX(-100%)';
    itemElement.style.opacity = '0';
    setTimeout(() => {
      cart.splice(idx, 1);
      saveCart();
      renderCart();
      showAddToCartNotification(`تم حذف "${removedItem.title}" من السلة`, 'info');
    }, 300);
  } else {
    cart.splice(idx, 1);
    saveCart();
    renderCart();
    showAddToCartNotification(`تم حذف "${removedItem.title}" من السلة`, 'info');
  }
};

// وظيفة إظهار إشعارات متنوعة محسنة
function showAddToCartNotification(message, type = 'success') {
  // إزالة الإشعار السابق إن وجد
  const existingNotification = document.querySelector('.cart-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // تحديد الأيقونة واللون حسب النوع
  let icon, colorClass;
  switch(type) {
    case 'success':
      icon = 'fas fa-check-circle';
      colorClass = 'success';
      break;
    case 'warning':
      icon = 'fas fa-exclamation-triangle';
      colorClass = 'warning';
      break;
    case 'info':
      icon = 'fas fa-info-circle';
      colorClass = 'info';
      break;
    default:
      icon = 'fas fa-check-circle';
      colorClass = 'success';
  }

  // إنشاء إشعار جديد
  const notification = document.createElement('div');
  notification.className = `cart-notification ${colorClass}`;
  notification.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;

  // تحديد موضع الإشعار حسب حجم الشاشة
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    notification.style.position = 'fixed';
    notification.style.top = '90px';
    notification.style.left = '1rem';
    notification.style.right = '1rem';
    notification.style.zIndex = '6000';
  }

  // إضافة الإشعار للصفحة
  document.body.appendChild(notification);

  // إظهار الإشعار مع تأثير اهتزاز خفيف
  setTimeout(() => {
    notification.classList.add('show');
    // تأثير اهتزاز للهواتف
    if (isMobile && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, 100);

  // إخفاء الإشعار بعد 4 ثوان (وقت أطول للهواتف)
  const hideDelay = isMobile ? 4000 : 3000;
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 400);
  }, hideDelay);
}

function showCartFab(show) {
  cartFab.style.display = show ? 'flex' : 'none';

  // إخفاء/إظهار قائمة الدعم الفني على الهواتف عند فتح/إغلاق السلة
  const supportChatFab = document.getElementById('support-chat-fab');
  if (supportChatFab && window.innerWidth <= 768) {
    if (show) {
      supportChatFab.classList.remove('hidden-on-mobile');
    } else {
      supportChatFab.classList.add('hidden-on-mobile');
    }
  }
}

cartFab.onclick = () => {
  cartSidebar.classList.add('open');
  showCartFab(false);
};
cartClose.onclick = () => {
  cartSidebar.classList.remove('open');
  showCartFab(true);
};

cartPayBtn.onclick = function() {
  if (cart.length === 0) return;

  // إظهار نموذج معلومات العميل
  showCustomerInfoModal();
};

// نموذج معلومات العميل
function showCustomerInfoModal() {
  const modal = document.createElement('div');
  modal.className = 'customer-modal';
  modal.innerHTML = `
    <div class="customer-modal-content">
      <div class="customer-modal-header">
        <h3>معلومات العميل</h3>
        <button class="customer-modal-close">&times;</button>
      </div>
      <form class="customer-form" id="customer-form">
        <div class="form-group">
          <label>الاسم الكامل *</label>
          <input type="text" name="name" required placeholder="أدخل اسمك الكامل">
        </div>
        <div class="form-group">
          <label>البريد الإلكتروني *</label>
          <input type="email" name="email" required placeholder="example@email.com">
        </div>
        <div class="form-group">
          <label>ملاحظات إضافية</label>
          <textarea name="notes" placeholder="أي ملاحظات خاصة بالطلب"></textarea>
        </div>
        <div class="order-summary">
          <h4>ملخص الطلب:</h4>
          <div class="order-items">
            ${cart.map(item => `
              <div class="order-item">
                <span>${item.title}</span>
                <span>$${item.price}</span>
              </div>
            `).join('')}
          </div>
          <div class="order-total">
            <strong>الإجمالي: $${cart.reduce((sum, item) => sum + Number(item.price), 0)}</strong>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel">إلغاء</button>
          <button type="submit" class="btn-submit">متابعة للدفع</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // إضافة الأحداث
  const closeBtn = modal.querySelector('.customer-modal-close');
  const cancelBtn = modal.querySelector('.btn-cancel');
  const form = modal.querySelector('#customer-form');

  closeBtn.onclick = cancelBtn.onclick = () => {
    modal.remove();
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    processOrder(new FormData(form));
    modal.remove();
  };

  // إظهار النموذج
  setTimeout(() => modal.classList.add('show'), 100);
}

// معالجة الطلب
function processOrder(formData) {
  const customerInfo = {
    name: formData.get('name'),
    email: formData.get('email'),
    orderTotal: cart.reduce((sum, item) => sum + Number(item.price), 0)
  };

  const orderData = {
    customerInfo: customerInfo,
    items: cart.map(item => ({...item})),
    total: customerInfo.orderTotal,
    notes: formData.get('notes')
  };

  // حفظ الطلب في قاعدة البيانات
  if (window.ordersDB) {
    const order = window.ordersDB.createOrder(orderData);
    console.log('تم إنشاء الطلب:', order);

    // إظهار رسالة نجاح
    showAddToCartNotification(`تم حفظ طلبك برقم #${order.id} بنجاح! 🎉`, 'success');
  }

  // متابعة عملية الدفع
  const total = orderData.total;
  const msg = encodeURIComponent(`طلب رقم #${Date.now()}\nالعميل: ${customerInfo.name}\nالبريد: ${customerInfo.email}\n\nالمنتجات:\n${cart.map(i => `- ${i.title} ($${i.price})`).join('\n')}\n\nالإجمالي: $${total}`);

  alert('تم حفظ طلبك! سيتم توجيهك الآن إلى PayPal لإتمام الدفع.');
  window.open(`https://paypal.me/AboodHammoud/${total}?country.x=SA&locale.x=en_US&note=${msg}`, '_blank');

  // تفريغ السلة بعد الطلب
  cart = [];
  saveCart();
  renderCart();
}

// إغلاق السلة عند الضغط خارجها
window.addEventListener('click', e => {
  if (cartSidebar.classList.contains('open') && !cartSidebar.contains(e.target) && !cartFab.contains(e.target)) {
    cartSidebar.classList.remove('open');
    showCartFab(true);
  }
});

// دعم إعادة رسم السلة عند التحديث
renderCart();

// عند تحميل الصفحة، أظهر الزر
showCartFab(true);

// إضافة مستمع لتغيير حجم الشاشة لإدارة قائمة الدعم الفني
window.addEventListener('resize', function() {
  const supportChatFab = document.getElementById('support-chat-fab');
  if (supportChatFab) {
    if (window.innerWidth > 768) {
      // إظهار قائمة الدعم الفني على الشاشات الكبيرة
      supportChatFab.classList.remove('hidden-on-mobile');
    } else if (cartSidebar.classList.contains('open')) {
      // إخفاء قائمة الدعم الفني على الهواتف إذا كانت السلة مفتوحة
      supportChatFab.classList.add('hidden-on-mobile');
    }
  }
});

// إغلاق السلة عند التفاعل مع القائمة المنسدلة
document.addEventListener('DOMContentLoaded', function() {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    dropdown.addEventListener('mouseenter', function() {
      // إغلاق السلة عند فتح القائمة المنسدلة
      if (cartSidebar.classList.contains('open')) {
        cartSidebar.classList.remove('open');
        showCartFab(true);
      }
    });
  });
});