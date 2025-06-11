document.addEventListener('DOMContentLoaded', function() {
  const list = document.getElementById('websites-list');
  if (!list || typeof websitesProducts === 'undefined') return;
  list.innerHTML = '';
  websitesProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <i class="fa ${product.icon}"></i>
      <div class="product-title">${product.name}</div>
      <div class="product-desc">${product.desc}</div>
      <div class="product-features">
        ${product.features.map(f => `<span>${f}</span>`).join(' ')}
      </div>
      <div class="product-price">${product.price} <span style='font-size:0.95em;color:#b9bbbe;'>دولار</span></div>
      <div style="display:flex;gap:0.5rem;">
        <button class="buy-btn" onclick="addToCart({id:'${product.id}',name:'${product.name}',price:${product.price},type:'website'})"><i class='fas fa-cart-plus'></i> أضف للسلة</button>
        <a class="buy-btn" href="https://www.paypal.com/paypalme/YOUR_PAYPAL_USERNAME/${product.price}" target="_blank"><i class="fab fa-paypal"></i> شراء مباشر</a>
      </div>
      <div class="user-views"><i class="fa fa-eye"></i> ${product.views} مشاهدة</div>
    `;
    list.appendChild(card);
  });
});
function addToCart(item) {
  if (window.cartAdd) window.cartAdd(item);
} 