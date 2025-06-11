const paypalBase = "https://www.paypal.com/paypalme/yourusername/";

const productsList = document.getElementById('products-list');

function createProductCard(product, idx) {
  const paypalLink = `${paypalBase}${product.price}`;
  return `
    <div class="product-card">
      <i class="fab fa-discord"></i>
      <div class="product-title">${product.title}</div>
      <div class="product-desc">${product.description}</div>
      <div class="product-features">
        ${product.features.map(f => `<span>${f}</span>`).join('')}
      </div>
      <div class="product-price">$${product.price}</div>
      <div style="display:flex;gap:0.5rem;">
        <button class="buy-btn add-to-cart-btn" data-type="product" data-idx="${idx}"><i class='fas fa-cart-plus'></i> أضف للسلة</button>
        <a class="buy-btn" href="${paypalLink}" target="_blank"><i class="fab fa-paypal"></i> شراء مباشر</a>
      </div>
    </div>
  `;
}

productsList.innerHTML = products.map(createProductCard).join('');

// إضافة حدث زر السلة
setTimeout(() => {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = this.getAttribute('data-idx');
      window.addToCart({
        type: 'product',
        title: products[idx].title,
        price: products[idx].price
      });
    });
  });
}, 100); 