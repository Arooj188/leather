const productsList = Array.isArray(window.products) ? window.products : [];
const config = window.businessConfig || {};

const state = {
  search: "",
  colour: "all",
  family: "all",
  sort: "name-asc"
};

let lastFocusedElement = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getUniqueColours() {
  return [...new Set(productsList.map((product) => product.colour))].sort((a, b) => a.localeCompare(b));
}

function getUniqueFamilies() {
  return [...new Set(productsList.map((product) => product.name))].sort((a, b) => a.localeCompare(b));
}

function populateColourFilter() {
  const colourFilter = document.getElementById("colourFilter");
  const options = getUniqueColours()
    .map((colour) => `<option value="${escapeHtml(colour)}">${escapeHtml(colour)}</option>`)
    .join("");

  colourFilter.innerHTML = `<option value="all">All colours</option>${options}`;
}

function populateFamilyFilter() {
  const familyFilter = document.getElementById("familyFilter");
  const options = getUniqueFamilies()
    .map((family) => `<option value="${escapeHtml(family)}">${escapeHtml(family)}</option>`)
    .join("");

  familyFilter.innerHTML = `<option value="all">All products</option>${options}`;
}

function getVisibleProducts() {
  const term = state.search.trim().toLowerCase();

  const filtered = productsList.filter((product) => {
    const searchSource = [product.code, product.name, product.colour, product.associatedText]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !term || searchSource.includes(term);
    const matchesColour = state.colour === "all" || product.colour === state.colour;
    const matchesFamily = state.family === "all" || product.name === state.family;

    return matchesSearch && matchesColour && matchesFamily;
  });

  const sorted = [...filtered];

  sorted.sort((a, b) => {
    switch (state.sort) {
      case "code-asc":
        return String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
      case "colour-asc":
        return a.colour.localeCompare(b.colour) || String(a.name).localeCompare(String(b.name));
      case "name-asc":
      default:
        return String(a.name).localeCompare(String(b.name)) || String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
    }
  });

  return sorted;
}

function renderCatalogue() {
  const productGrid = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");
  const countElement = document.getElementById("resultsCount");
  const visibleProducts = getVisibleProducts();

  countElement.textContent =
    visibleProducts.length === productsList.length
      ? `${productsList.length} products available`
      : `Showing ${visibleProducts.length} of ${productsList.length} products`;

  if (!visibleProducts.length) {
    productGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  productGrid.innerHTML = visibleProducts.map((product) => createProductCardMarkup(product)).join("");

  productGrid.querySelectorAll(".product-card__cta").forEach((button) => {
    button.addEventListener("click", () => {
      openProductModal(button.dataset.productCode);
    });
  });
}

function createProductCardMarkup(product) {
  const imageMarkup = getProductImageMarkup(product);
  const noteText = product.publicSpecifications && product.publicSpecifications.length
    ? `<li>${escapeHtml(product.publicSpecifications[0])}</li>`
    : "<li>Product details available on request.</li>";

  return `
    <article class="product-card" aria-label="${escapeHtml(product.name)} product card">
      <div class="product-card__media">${imageMarkup}</div>
      <div class="product-card__content">
        <h3 class="product-card__name">${escapeHtml(product.name)}</h3>
        <p class="product-card__code">Code ${escapeHtml(product.code)}</p>
        <div class="product-card__meta">
          <span>${escapeHtml(product.colour)}</span>
          <span>${escapeHtml(product.unit)}</span>
        </div>
        <ul class="product-card__specs">${noteText}</ul>
        <button type="button" class="product-card__cta" data-product-code="${escapeHtml(product.code)}">View Details</button>
      </div>
    </article>
  `;
}

function getProductImageMarkup(product) {
  if (product.image && product.imageStatus !== "missing") {
    return `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)} in ${escapeHtml(product.colour)}" />`;
  }

  return `
    <div class="product-placeholder" role="img" aria-label="Product image coming soon">
      <span>Product image coming soon</span>
    </div>
  `;
}

function bindEvents() {
  const searchInput = document.getElementById("searchInput");
  const colourFilter = document.getElementById("colourFilter");
  const familyFilter = document.getElementById("familyFilter");
  const sortSelect = document.getElementById("sortSelect");
  const resetButton = document.getElementById("resetFilters");

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderCatalogue();
  });

  colourFilter.addEventListener("change", (event) => {
    state.colour = event.target.value;
    renderCatalogue();
  });

  familyFilter.addEventListener("change", (event) => {
    state.family = event.target.value;
    renderCatalogue();
  });

  sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderCatalogue();
  });

  resetButton.addEventListener("click", () => {
    state.search = "";
    state.colour = "all";
    state.family = "all";
    state.sort = "name-asc";

    searchInput.value = "";
    colourFilter.value = "all";
    familyFilter.value = "all";
    sortSelect.value = "name-asc";

    renderCatalogue();
  });
}

function renderContactDetails() {
  const contactDetails = document.getElementById("contactDetails");
  const whatsappLink = document.getElementById("whatsappLink");
  const emailLink = document.getElementById("emailLink");
  const contactNote = document.getElementById("contactNote");
  const footerContact = document.getElementById("footerContact");

  const entries = [];

  if (contactDetails) {
    contactDetails.innerHTML = "";
  }

  if (config.email) {
    entries.push({ label: "Email", value: config.email, href: `mailto:${config.email}` });
  }

  if (config.city || config.address) {
    const locationParts = [config.city, config.address].filter(Boolean);
    entries.push({ label: "Location", value: locationParts.join(" — ") || "", href: "" });
  }

  if (config.socialLinks) {
    Object.entries(config.socialLinks).forEach(([network, value]) => {
      if (value) {
        entries.push({ label: network.charAt(0).toUpperCase() + network.slice(1), value: value, href: value });
      }
    });
  }

  if (!entries.length && !config.whatsappNumber) {
    if (contactDetails) {
      contactDetails.innerHTML = "<p>No public contact details have been configured yet.</p>";
    }
    footerContact.innerHTML = "";
    if (contactNote) {
      contactNote.textContent = "Contact information will appear here once the business owner supplies approved details.";
    }
    whatsappLink.href = "#";
    whatsappLink.setAttribute("aria-disabled", "true");
    whatsappLink.classList.add("button-disabled");
    whatsappLink.classList.add("is-disabled");
    whatsappLink.textContent = "WhatsApp enquiry unavailable";
    emailLink.href = "#";
    emailLink.setAttribute("aria-disabled", "true");
    emailLink.textContent = "Email enquiry unavailable";
    return;
  }

  if (!entries.length && config.whatsappNumber) {
    if (contactDetails) {
      contactDetails.innerHTML = "";
    }
    footerContact.innerHTML = "";
    if (contactNote) {
      contactNote.textContent = "";
    }
    whatsappLink.href = getDirectWhatsAppLink("Hello, I would like to enquire about a product from Atif Leather Store. Please share the available details and pricing information.");
    whatsappLink.setAttribute("aria-disabled", "false");
    whatsappLink.classList.remove("is-disabled");
    whatsappLink.textContent = "Send enquiry on WhatsApp";
    whatsappLink.removeAttribute("tabindex");
    whatsappLink.setAttribute("target", "_blank");
    whatsappLink.setAttribute("rel", "noopener noreferrer");
    emailLink.href = "#";
    emailLink.setAttribute("aria-disabled", "true");
    emailLink.textContent = "Email enquiry unavailable";
    return;
  }

  contactDetails.innerHTML = `
    <dl class="contact-list">
      ${entries
        .map((entry) => {
          if (!entry.value) return "";
          const content = entry.href ? `<a href="${escapeHtml(entry.href)}">${escapeHtml(entry.value)}</a>` : `<span>${escapeHtml(entry.value)}</span>`;
          return `<div class="contact-item"><dt>${escapeHtml(entry.label)}</dt><dd>${content}</dd></div>`;
        })
        .join("")}
    </dl>
  `;

  footerContact.innerHTML = entries
    .slice(0, 3)
    .map((entry) => {
      if (!entry.value) return "";
      if (entry.href) {
        return `<a href="${escapeHtml(entry.href)}">${escapeHtml(entry.label)}</a>`;
      }
      return `<span>${escapeHtml(entry.label)}</span>`;
    })
    .join("");

  if (config.whatsappNumber) {
    const validNumber = cleanWhatsAppNumber(config.whatsappNumber);
    whatsappLink.href = getDirectWhatsAppLink("Hello, I would like to enquire about a product from Atif Leather Store. Please share the available details and pricing information.");
    whatsappLink.setAttribute("aria-disabled", "false");
    whatsappLink.classList.remove("is-disabled");
    whatsappLink.textContent = "Send enquiry on WhatsApp";
    whatsappLink.removeAttribute("tabindex");
    whatsappLink.setAttribute("target", "_blank");
    whatsappLink.setAttribute("rel", "noopener noreferrer");
  } else {
    whatsappLink.href = "#";
    whatsappLink.setAttribute("aria-disabled", "true");
    whatsappLink.classList.add("is-disabled");
    whatsappLink.textContent = "WhatsApp enquiry unavailable";
    whatsappLink.removeAttribute("target");
    whatsappLink.removeAttribute("rel");
  }

  if (config.email) {
    emailLink.href = `mailto:${config.email}?subject=${encodeURIComponent("Product enquiry")}`;
    emailLink.setAttribute("aria-disabled", "false");
    emailLink.textContent = "Email enquiry";
  } else {
    emailLink.href = "#";
    emailLink.setAttribute("aria-disabled", "true");
    emailLink.textContent = "Email enquiry unavailable";
  }

  if (contactNote) {
    contactNote.textContent = config.whatsappNumber
      ? "We respond quickly to product and stock enquiries from customers who need assistance choosing the right material."
      : "Business contact details are still being confirmed. The public enquiry paths will be activated once approved.";
  }
}

function cleanWhatsAppNumber(rawValue) {
  return String(rawValue || "").replace(/[^\d]/g, "");
}

function getDirectWhatsAppLink(message) {
  const whatsappNumber = config.whatsappNumber ? cleanWhatsAppNumber(config.whatsappNumber) : "";
  if (!whatsappNumber) {
    return "#";
  }

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function buildWhatsAppLink(product) {
  const message = `Hello, I am interested in ${product.name}, product code ${product.code}. Please share further details.`;
  return getDirectWhatsAppLink(message);
}

function buildEmailLink(product) {
  if (!config.email) {
    return "#";
  }

  const subject = `Enquiry for ${product.name} (${product.code})`;
  const body = `Hello, I would like to enquire about ${product.name}, product code ${product.code}. Please share the available details.`;
  return `mailto:${config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function openProductModal(productCode) {
  const product = productsList.find((item) => String(item.code) === String(productCode));
  if (!product) {
    return;
  }

  lastFocusedElement = document.activeElement;

  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("modalContent");
  const specItems = product.publicSpecifications && product.publicSpecifications.length
    ? product.publicSpecifications.map((spec) => `<li>${escapeHtml(spec)}</li>`).join("")
    : "<li>Specifications will be confirmed before publication.</li>";

  const associatedText = product.associatedText ? `<div class="detail-row"><dt>Associated text</dt><dd>${escapeHtml(product.associatedText)}</dd></div>` : "";

  modalContent.innerHTML = `
    <div class="modal-body">
      <div class="modal-media">${getProductImageMarkup(product)}</div>
      <div class="modal-content">
        <p class="modal-kicker">Inventory item</p>
        <h3 id="modalTitle">${escapeHtml(product.name)}</h3>
        <dl class="detail-list">
          <div class="detail-row"><dt>Inventory code</dt><dd>${escapeHtml(product.code)}</dd></div>
          <div class="detail-row"><dt>Colour</dt><dd>${escapeHtml(product.colour)}</dd></div>
          <div class="detail-row"><dt>Unit</dt><dd>${escapeHtml(product.unit)}</dd></div>
          ${associatedText}
        </dl>

        <h4>Public specifications</h4>
        <ul class="spec-list">${specItems}</ul>

        <div class="modal-actions">
          <button type="button" class="button button-secondary" data-close-modal="true">Back to catalogue</button>
          <a
            href="${escapeHtml(buildWhatsAppLink(product))}"
            class="button button-primary ${config.whatsappNumber ? "" : "is-disabled"}"
            aria-disabled="${config.whatsappNumber ? "false" : "true"}"
            ${config.whatsappNumber ? "" : 'tabindex="-1"'}
          >
            Enquire on WhatsApp
          </a>
          <a href="${escapeHtml(buildEmailLink(product))}" class="button button-secondary ${config.email ? "" : "is-disabled"}" aria-disabled="${config.email ? "false" : "true"}" ${config.email ? "" : 'tabindex="-1"'}>Email enquiry</a>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  const closeButton = document.getElementById("modalCloseButton");
  closeButton.focus();

  modal.querySelectorAll("[data-close-modal='true']").forEach((button) => {
    button.addEventListener("click", closeProductModal);
  });

  closeButton.addEventListener("click", closeProductModal);
  modal.addEventListener("click", (event) => {
    if (event.target.dataset.closeModal === "true") {
      closeProductModal();
    }
  });
}

function closeProductModal() {
  const modal = document.getElementById("productModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function setCopyrightYear() {
  const currentYear = new Date().getFullYear();
  const yearTarget = document.getElementById("currentYear");
  if (yearTarget) {
    yearTarget.textContent = currentYear;
  }
}

function setActiveNav() {
  const sections = ["home", "catalogue", "about", "contact"];
  const navLinks = [...document.querySelectorAll(".main-nav a")];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("active", isActive);
          });
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((id) => {
    const section = document.getElementById(id);
    if (section) {
      observer.observe(section);
    }
  });
}

function initMobileNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (!toggle || !mobileMenu) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isExpanded));
    mobileMenu.hidden = isExpanded;
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      mobileMenu.hidden = true;
    });
  });
}

function setHeroWhatsAppLink() {
  const heroWhatsApp = document.getElementById("heroWhatsApp");
  if (!heroWhatsApp) {
    return;
  }

  heroWhatsApp.href = getDirectWhatsAppLink("Hello, I would like to enquire about a product from Atif Leather Store.");
  heroWhatsApp.setAttribute("target", "_blank");
  heroWhatsApp.setAttribute("rel", "noopener noreferrer");
}

function init() {
  populateColourFilter();
  populateFamilyFilter();
  bindEvents();
  renderContactDetails();
  setHeroWhatsAppLink();
  renderCatalogue();
  setCopyrightYear();
  setActiveNav();
  initMobileNavigation();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const modal = document.getElementById("productModal");
      if (!modal.classList.contains("hidden")) {
        closeProductModal();
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", init);
