const paypalBase = "https://www.paypal.com/paypalme/yourusername/";

const usersList = document.getElementById('users-list');

function createUserCard(user, idx) {
  const paypalLink = user.available && user.price ? `${paypalBase}${user.price}` : "#";
  return `
    <div class="user-card${!user.available ? ' soon' : ''}">
      <i class="fa fa-user"></i>
      <div class="user-name">${user.name}</div>
      <div class="user-desc">${user.description}</div>
      <div class="user-views">${user.views !== null ? `👁️ ${user.views}` : ''}</div>
      <div class="user-price">${user.price ? `$${user.price}` : ''}</div>
      <div style="display:flex;gap:0.5rem;">
        ${user.available ? `<button class='buy-btn add-to-cart-btn' data-type='user' data-idx='${idx}'><i class='fas fa-cart-plus'></i> أضف للسلة</button>` : ''}
        <a class="buy-btn" href="${paypalLink}" target="_blank" ${!user.available ? 'disabled style="pointer-events:none;"' : ''}>
          <i class="fab fa-paypal"></i> ${user.available ? 'شراء مباشر' : 'قريباً'}
        </a>
      </div>
    </div>
  `;
}

usersList.innerHTML = discordUsers.map(createUserCard).join('');

// إضافة حدث زر السلة
setTimeout(() => {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = this.getAttribute('data-idx');
      window.addToCart({
        type: 'user',
        title: discordUsers[idx].name,
        price: discordUsers[idx].price
      });
    });
  });
}, 100); 