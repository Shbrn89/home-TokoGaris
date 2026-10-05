/* ====================================================
   TokoGaris — Prototype interactivity
   Vanilla JS, no dependencies. Keeps the prototype feeling
   like a real product: clickable cards, working filters,
   license/payment selection, toasts, toggles, etc.
   ==================================================== */
(function () {
  "use strict";

  /* ---------------- Toast ---------------- */
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2600);
  }

  /* Any element with data-toast shows a message instead of navigating
     (used for nav links / buttons that have no real destination in
     this prototype). */
  document.querySelectorAll("[data-toast]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      showToast(el.getAttribute("data-toast"));
      // Auto-close the mobile nav dropdown after a choice is made.
      var navToggle = document.getElementById("nav-toggle");
      if (navToggle) navToggle.checked = false;
    });
  });

  /* Close the mobile hamburger dropdown after a real navigation link
     is tapped too, so it doesn't stay open on the next page view. */
  document.querySelectorAll(".f-nav-links a:not([data-toast])").forEach(function (el) {
    el.addEventListener("click", function () {
      var navToggle = document.getElementById("nav-toggle");
      if (navToggle) navToggle.checked = false;
    });
  });

  /* ---------------- Clickable design cards ---------------- */
  document.querySelectorAll(".f-design-card[data-href]").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".f-fav-btn")) return;
      window.location.href = card.getAttribute("data-href");
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = card.getAttribute("data-href");
      }
    });
  });

  /* ---------------- Favorite (heart) buttons ---------------- */
  document.querySelectorAll(".f-fav-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var active = btn.classList.toggle("is-active");
      btn.textContent = active ? "♥" : "♡";
      var card = btn.closest(".f-design-card");
      var titleEl = card ? card.querySelector("h3") : null;
      var title = titleEl ? titleEl.textContent : "Design";
      showToast(active ? '"' + title + '" ditambahkan ke favorit' : '"' + title + '" dihapus dari favorit');
    });
  });

  /* ---------------- Hero / catalog search ---------------- */
  var heroForm = document.getElementById("hero-search-form");
  if (heroForm) {
    heroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = document.getElementById("hero-search-input").value.trim();
      window.location.href = "tokogaris-catalog.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    });
  }

  var catalogSearchForm = document.getElementById("catalog-search-form");
  var catalogSearchInput = document.getElementById("catalog-search-input");
  if (catalogSearchForm) {
    catalogSearchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      applyCatalogFilters();
    });
  }
  // Pre-fill search box from ?q= when arriving from the home page.
  (function prefillFromQuery() {
    if (!catalogSearchInput) return;
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) catalogSearchInput.value = q;
  })();

  /* ---------------- Catalog filters (style/market/complexity/license/price) ---------------- */
  var catalogGrid = document.getElementById("catalog-grid");
  var resultCountEl = document.getElementById("result-count");
  var emptyStateEl = document.getElementById("empty-state");
  var sortSelect = document.getElementById("sort-select");

  function activeValuesInGroup(groupEl) {
    return Array.prototype.map.call(
      groupEl.querySelectorAll(".f-pill.is-active"),
      function (p) { return p.getAttribute("data-value"); }
    );
  }

  function activePriceRange() {
    var priceGroup = document.querySelector('.f-filter-group[data-group="price"]');
    if (!priceGroup) return null;
    var active = priceGroup.querySelector(".f-pill.is-active");
    if (!active) return null;
    return { min: Number(active.getAttribute("data-min")), max: Number(active.getAttribute("data-max")) };
  }

  function applyCatalogFilters() {
    if (!catalogGrid) return;
    var styleGroup = document.querySelector('.f-filter-group[data-group="style"]');
    var marketGroup = document.querySelector('.f-filter-group[data-group="market"]');
    var complexityGroup = document.querySelector('.f-filter-group[data-group="complexity"]');
    var licenseGroup = document.querySelector('.f-filter-group[data-group="license"]');

    var styles = styleGroup ? activeValuesInGroup(styleGroup) : [];
    var markets = marketGroup ? activeValuesInGroup(marketGroup) : [];
    var complexities = complexityGroup ? activeValuesInGroup(complexityGroup) : [];
    var licenses = licenseGroup ? activeValuesInGroup(licenseGroup) : [];
    var price = activePriceRange();
    var query = (catalogSearchInput && catalogSearchInput.value.trim().toLowerCase()) || "";

    var cards = Array.prototype.slice.call(catalogGrid.querySelectorAll(".f-design-card"));
    var visibleCount = 0;

    cards.forEach(function (card) {
      var matchesStyle = styles.length === 0 || styles.indexOf(card.getAttribute("data-style")) !== -1;
      var matchesMarket = markets.length === 0 || markets.indexOf(card.getAttribute("data-market")) !== -1;
      var matchesComplexity = complexities.length === 0 || complexities.indexOf(card.getAttribute("data-complexity")) !== -1;
      var matchesLicense = licenses.length === 0 || licenses.indexOf(card.getAttribute("data-license")) !== -1;
      var cardPrice = Number(card.getAttribute("data-price"));
      var matchesPrice = !price || (cardPrice >= price.min && cardPrice <= price.max);
      var text = card.textContent.toLowerCase();
      var matchesQuery = !query || text.indexOf(query) !== -1;

      var visible = matchesStyle && matchesMarket && matchesComplexity && matchesLicense && matchesPrice && matchesQuery;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });

    if (resultCountEl) resultCountEl.textContent = visibleCount.toLocaleString("id-ID");
    if (emptyStateEl) emptyStateEl.hidden = visibleCount !== 0;
    catalogGrid.classList.add("is-filtering");
    setTimeout(function () { catalogGrid.classList.remove("is-filtering"); }, 250);
  }

  function sortCatalog(mode) {
    if (!catalogGrid) return;
    var cards = Array.prototype.slice.call(catalogGrid.querySelectorAll(".f-design-card"));
    cards.sort(function (a, b) {
      if (mode === "price-asc") return Number(a.getAttribute("data-price")) - Number(b.getAttribute("data-price"));
      if (mode === "price-desc") return Number(b.getAttribute("data-price")) - Number(a.getAttribute("data-price"));
      return 0; // "newest" keeps original document order
    });
    cards.forEach(function (card) { catalogGrid.appendChild(card); });
  }

  document.querySelectorAll(".f-filters .f-pill").forEach(function (pill) {
    pill.addEventListener("click", function () {
      var group = pill.closest(".f-filter-group");
      var isPriceGroup = group && group.getAttribute("data-group") === "price";
      if (isPriceGroup) {
        // Price range is single-select: clicking the active one clears it.
        var wasActive = pill.classList.contains("is-active");
        group.querySelectorAll(".f-pill").forEach(function (p) { p.classList.remove("is-active"); });
        if (!wasActive) pill.classList.add("is-active");
      } else {
        pill.classList.toggle("is-active");
      }
      applyCatalogFilters();
    });
  });

  var filtersResetBtn = document.getElementById("filters-reset");
  var emptyResetBtn = document.getElementById("empty-reset");
  function resetFilters() {
    document.querySelectorAll(".f-filters .f-pill.is-active").forEach(function (p) {
      p.classList.remove("is-active");
    });
    if (catalogSearchInput) catalogSearchInput.value = "";
    applyCatalogFilters();
  }
  if (filtersResetBtn) filtersResetBtn.addEventListener("click", resetFilters);
  if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetFilters);

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      sortCatalog(sortSelect.value);
    });
  }

  // Run once on catalog page load so result count reflects the (empty) filter state.
  if (catalogGrid) applyCatalogFilters();

  /* ---------------- Design detail: license selection ---------------- */
  var licenseOptions = document.querySelectorAll(".f-license-option");
  var buyBtn = document.getElementById("buy-license-btn");
  var selectedLicenseNameEl = document.getElementById("selected-license-name");
  if (licenseOptions.length) {
    licenseOptions.forEach(function (opt) {
      function select() {
        licenseOptions.forEach(function (o) {
          o.classList.remove("is-selected");
          o.setAttribute("aria-checked", "false");
        });
        opt.classList.add("is-selected");
        opt.setAttribute("aria-checked", "true");
        if (selectedLicenseNameEl) {
          var shortName = (opt.getAttribute("data-license") || "").replace(" license", "");
          selectedLicenseNameEl.textContent = shortName;
        }
      }
      opt.addEventListener("click", select);
      opt.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
      });
    });
  }

  var addCartBtn = document.getElementById("add-cart-btn");
  if (addCartBtn) {
    addCartBtn.addEventListener("click", function () {
      var selected = document.querySelector(".f-license-option.is-selected");
      var name = selected ? selected.getAttribute("data-license") : "License";
      showToast('Ditambahkan ke keranjang: ' + name);
    });
  }

  /* ---------------- Design detail: thumbnail / preview switch ---------------- */
  var thumbButtons = document.querySelectorAll(".f-thumb");
  var mainPreviewLabel = document.getElementById("main-preview-label");
  thumbButtons.forEach(function (thumb) {
    thumb.addEventListener("click", function () {
      thumbButtons.forEach(function (t) { t.classList.remove("is-active"); });
      thumb.classList.add("is-active");
      if (mainPreviewLabel) {
        mainPreviewLabel.textContent = "⌸ WATERMARKED PREVIEW · view " + thumb.getAttribute("data-view");
      }
    });
  });

  /* ---------------- Checkout: payment method selection ---------------- */
  var paymentOptions = document.querySelectorAll(".f-payment-option");
  paymentOptions.forEach(function (opt) {
    function select() {
      paymentOptions.forEach(function (o) {
        o.classList.remove("is-selected");
        o.setAttribute("aria-checked", "false");
      });
      opt.classList.add("is-selected");
      opt.setAttribute("aria-checked", "true");
    }
    opt.addEventListener("click", select);
    opt.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
    });
  });

  /* ---------------- Checkout: agreement + pay button ---------------- */
  var agreeCheckbox = document.getElementById("agree-checkbox");
  var payBtn = document.getElementById("pay-btn");
  function syncPayButtonState() {
    if (!payBtn || !agreeCheckbox) return;
    var enabled = agreeCheckbox.checked;
    payBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
    payBtn.disabled = !enabled;
  }
  if (agreeCheckbox) {
    agreeCheckbox.addEventListener("change", syncPayButtonState);
    syncPayButtonState();
  }
  if (payBtn) {
    payBtn.addEventListener("click", function () {
      if (payBtn.disabled) {
        showToast("Setujui ketentuan lisensi terlebih dahulu untuk melanjutkan.");
        return;
      }
      var selectedPayment = document.querySelector(".f-payment-option.is-selected");
      var method = selectedPayment ? selectedPayment.getAttribute("data-method") : "payment method";
      payBtn.classList.add("is-processing");
      payBtn.textContent = "Processing…";
      setTimeout(function () {
        payBtn.classList.remove("is-processing");
        payBtn.textContent = "Pay securely →";
        showToast("Pembayaran via " + method + " berhasil disimulasikan ✓");
      }, 1200);
    });
  }

  /* ---------------- Dashboard: watermark toggle ---------------- */
  var watermarkToggle = document.getElementById("watermark-toggle");
  if (watermarkToggle) {
    watermarkToggle.addEventListener("click", function () {
      var on = !watermarkToggle.classList.contains("is-on");
      watermarkToggle.classList.toggle("is-on", on);
      watermarkToggle.setAttribute("aria-checked", on ? "true" : "false");
      showToast(on ? "Watermark otomatis diaktifkan" : "Watermark otomatis dimatikan");
    });
  }

  /* ---------------- Dashboard: sidebar active state ---------------- */
  var dashSidebar = document.getElementById("dash-sidebar");
  if (dashSidebar) {
    dashSidebar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        dashSidebar.querySelectorAll("a").forEach(function (l) { l.classList.remove("is-active"); });
        link.classList.add("is-active");
      });
    });
  }

  /* ---------------- Dashboard: save draft / publish buttons ---------------- */
  var saveDraftBtn = document.getElementById("save-draft-btn");
  var publishBtn = document.getElementById("publish-btn");
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", function () {
      showToast("Draft desain disimpan.");
    });
  }
  if (publishBtn) {
    publishBtn.addEventListener("click", function () {
      var titleInput = document.querySelector('.f-form-field input[placeholder^="e.g."]');
      var title = titleInput && titleInput.value.trim();
      showToast(title ? '"' + title + '" dipublikasikan ke marketplace ✓' : "Desain dipublikasikan ke marketplace ✓");
    });
  }

})();
