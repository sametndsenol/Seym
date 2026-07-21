(function () {
  function applySectionHtml(sectionsHtml) {
    if (!sectionsHtml || !sectionsHtml['cart-icon-bubble']) return;
    var bubble = document.getElementById('cart-icon-bubble');
    if (!bubble) return;
    var doc = new DOMParser().parseFromString(sectionsHtml['cart-icon-bubble'], 'text/html');
    var fresh = doc.querySelector('.shopify-section');
    if (fresh) bubble.innerHTML = fresh.innerHTML;
  }

  document.querySelectorAll('[data-seym-gift-wrap]').forEach(function (root) {
    var checkbox = root.querySelector('.seym-gift-wrap__box');
    var status = root.querySelector('[data-seym-gift-wrap-status]');
    var variantId = Number(root.dataset.variantId);
    if (!checkbox || !variantId) return;

    checkbox.addEventListener('change', function () {
      var wantChecked = checkbox.checked;
      checkbox.disabled = true;
      status.textContent = wantChecked ? root.dataset.addingText : root.dataset.removingText;

      // /cart/add.js accepts a numeric id; /cart/change.js requires it as a string
      // (a bare number 400s: "expected Integer to be a ... : id").
      var url = wantChecked ? window.routes.cart_add_url : window.routes.cart_change_url;
      var body = wantChecked
        ? { id: variantId, quantity: 1, sections: 'cart-icon-bubble', sections_url: window.location.pathname }
        : { id: String(variantId), quantity: 0, sections: 'cart-icon-bubble', sections_url: window.location.pathname };

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.status) {
            checkbox.checked = !wantChecked;
            status.textContent = root.dataset.errorText;
            return;
          }
          status.textContent = wantChecked ? root.dataset.addedText : '';
          applySectionHtml(data.sections);
        })
        .catch(function () {
          checkbox.checked = !wantChecked;
          status.textContent = root.dataset.errorText;
        })
        .finally(function () {
          checkbox.disabled = false;
        });
    });
  });
})();
