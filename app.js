(() => {
  "use strict";

  const API_URL = "https://script.google.com/macros/s/AKfycbwHwnZYv1YJEZNzi5KBnsXCDidq2aU7G30g4BGQaZeC_pFkqFMHpEY-oripZqLU5L1x/exec";
  const $ = (selector) => document.querySelector(selector);

  const state = {
    language: localStorage.getItem("grocery-language") || "my",
    products: [],
    categories: [],
    loading: false,
    error: "",
    search: "",
    category: "all",
    subcategory: "all",
    brand: "all"
  };

  const translations = {
    my: {
      storeName: "ဦးစန်းကို + ဒေါ်ခင်တာ ကုန်စုံဆိုင်",
      storeTagline: "နေ့စဉ်သုံး ကုန်ပစ္စည်းများ",
      eyebrow: "OUR STORE MENU",
      headline: "ဆိုင်ရှိ ကုန်ပစ္စည်းများ",
      welcomeCopy: "ပစ္စည်းအမည်၊ အမှတ်တံဆိပ်တို့ဖြင့် ရှာဖွေနိုင်ပါတယ်။",
      liveMenu: "Product menu",
      searchPlaceholder: "ပစ္စည်း / Brand ရှာရန်",
      refresh: "ပြန်လည်ရယူရန်",
      loading: "ပစ္စည်းများ ရယူနေပါတယ်…",
      emptyTitle: "ပစ္စည်းမတွေ့ပါ",
      emptyCopy: "အခြားအမည်ဖြင့် ပြန်လည်ရှာဖွေကြည့်ပါ။",
      reset: "Filter များဖယ်ရှားရန်",
      allCategories: "အမျိုးအစားအားလုံး",
      allSubcategories: "အမျိုးအစားခွဲအားလုံး",
      allBrands: "Brand အားလုံး",
      available: "ရှိပါသည်",
      unavailable: "မရှိသေးပါ",
      items: "မျိုး",
      footerName: "ဦးစန်းကို + ဒေါ်ခင်တာ ကုန်စုံဆိုင်",
      footerNote: "ဈေးနှုန်းနှင့် ပစ္စည်းရရှိမှုကို ဆိုင်တွင် ထပ်မံအတည်ပြုနိုင်ပါတယ်။",
      loadError: "ပစ္စည်းများကို ရယူ၍မရပါ။ Internet သို့မဟုတ် API ကို စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။",
      updated: "နောက်ဆုံးပြင်ဆင်ချိန်"
    },
    en: {
      storeName: "U San Ko + Daw Khin Tar Grocery Store",
      storeTagline: "Everyday grocery essentials",
      eyebrow: "OUR STORE MENU",
      headline: "Our Products",
      welcomeCopy: "Search by product name or brand.",
      liveMenu: "Product menu",
      searchPlaceholder: "Search products or brands",
      refresh: "Refresh",
      loading: "Loading products…",
      emptyTitle: "No products found",
      emptyCopy: "Try another search or clear your filters.",
      reset: "Clear filters",
      allCategories: "All categories",
      allSubcategories: "All subcategories",
      allBrands: "All brands",
      available: "Available",
      unavailable: "Out of stock",
      items: "products",
      footerName: "U San Ko + Daw Khin Tar Grocery Store",
      footerNote: "Please confirm prices and availability with the store.",
      loadError: "Unable to load products. Check your internet connection or API and try again.",
      updated: "Last updated"
    }
  };

  function clean(value) {
    if (value === null || value === undefined) return "";
    const result = String(value).trim();
    return /^(undefined|null)$/i.test(result) ? "" : result;
  }

  function firstValue(object, keys) {
    for (const key of keys) {
      const value = clean(object?.[key]);
      if (value) return value;
    }
    return "";
  }

  function languageValue(mm, en) {
    return state.language === "en" ? (clean(en) || clean(mm)) : (clean(mm) || clean(en));
  }

  // Brand fallback: use the selected language first, then the other language.
  function getBrand(product) {
    return languageValue(product.Brand_MM, product.Brand_EN);
  }

  function getProductName(product) {
    return languageValue(product.Item_Name_MM, product.Item_Name_EN) ||
      languageValue(product.Name_MM, product.Name_EN) || "Unnamed product";
  }

  function getEnglishName(product) {
    return clean(product.Item_Name_EN) || clean(product.Name_EN);
  }


function requestJSONP(apiUrl, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "groceryCallback_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    const script = document.createElement("script");
    const url = new URL(apiUrl);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    url.searchParams.set("callback", callbackName);

    let timeout;

    function cleanup() {
      delete window[callbackName];
      script.remove();
      clearTimeout(timeout);
    }

    window[callbackName] = (result) => {
      cleanup();
      resolve(result);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Unable to connect to Google Apps Script API"));
    };

    timeout = setTimeout(() => {
      cleanup();
      reject(new Error("API request timed out"));
    }, 20000);

    script.async = true;
    script.src = url.toString();

    document.head.appendChild(script);
  });
}


  function getCategoryRecord(id, type = "category") {
    const key = type === "subcategory"
      ? "Subcategory_ID"
      : "Category_ID";

    return state.categories.find((item) =>
      clean(item[key]) === clean(id)
    );
  }

  function categoryName(product, sub = false) {
    const id = sub
      ? firstValue(product, ["Subcategory_ID"])
      : firstValue(product, ["Category_ID"]);
    const record = getCategoryRecord(
      id,
      sub ? "subcategory" : "category"
    );
    const mm = sub
      ? firstValue(record, ["Subcategory_MM", "Category_MM", "Name_MM", "Name"])
      : firstValue(record, ["Category_MM", "Name_MM", "Name"]);
    const en = sub
      ? firstValue(record, ["Subcategory_EN", "Category_EN", "Name_EN", "Name"])
      : firstValue(record, ["Category_EN", "Name_EN", "Name"]);
    return languageValue(mm, en) || id || (state.language === "en" ? "Other" : "အခြား");
  }

  function isAvailable(value) {
    if (typeof value === "boolean") return value;
    const normalized = clean(value).toLowerCase();
    return ["true", "1", "yes", "y", "available", "ရှိ", "ရှိသည်", "ရ"].includes(normalized);
  }

  function formatPrice(value) {
    const number = Number(String(value ?? "").replace(/,/g, ""));
    if (!Number.isFinite(number) || value === "" || value === null || value === undefined) {
      return state.language === "en" ? "Price not set" : "ဈေးနှုန်းမသတ်မှတ်ရသေး";
    }
    return `${new Intl.NumberFormat(state.language === "en" ? "en-US" : "my-MM", {
      maximumFractionDigits: 0
    }).format(number)} Ks`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function setLanguage(language) {
    state.language = language;
    localStorage.setItem("grocery-language", language);
    document.documentElement.lang = language === "en" ? "en" : "my";
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (translations[language][key]) element.textContent = translations[language][key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (translations[language][key]) element.placeholder = translations[language][key];
    });
    $("#languageToggle").textContent = language === "en" ? "မြန်မာ" : "EN";
    renderFilters();
    renderProducts();
  }

  function getUniqueValues(key) {
    return [...new Set(state.products.map((product) => clean(product[key])).filter(Boolean))];
  }

  function fillSelect(select, values, allLabel, labelFn = (value) => value) {
    const previous = select.value;
    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = allLabel;
    select.appendChild(all);
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = labelFn(value);
      select.appendChild(option);
    });
    select.value = values.includes(previous) ? previous : "all";
  }

  function renderFilters() {
    const t = translations[state.language];
    const categoryIds = getUniqueValues("Category_ID");
    const subcategoryIds = getUniqueValues("Subcategory_ID");
    const brands = [...new Set(state.products.map(getBrand).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    fillSelect($("#categoryFilter"), categoryIds, t.allCategories,
      (id) => categoryName({ Category_ID: id }));
    fillSelect($("#subcategoryFilter"), subcategoryIds, t.allSubcategories,
      (id) => categoryName({ Subcategory_ID: id }, true));
    fillSelect($("#brandFilter"), brands, t.allBrands);

    const chips = $("#categoryChips");
    chips.innerHTML = "";
    const allChip = makeChip("all", t.allCategories);
    chips.appendChild(allChip);
    categoryIds.forEach((id) => chips.appendChild(makeChip(id, categoryName({ Category_ID: id }))));
  }

  function makeChip(value, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-chip${state.category === value ? " active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.category = value;
      $("#categoryFilter").value = value;
      renderFilters();
      renderProducts();
    });
    return button;
  }

  function filteredProducts() {
    const term = state.search.toLocaleLowerCase();
    return state.products.filter((product) => {
      if (state.category !== "all" && clean(product.Category_ID) !== state.category) return false;
      if (state.subcategory !== "all" && clean(product.Subcategory_ID) !== state.subcategory) return false;
      if (state.brand !== "all" && getBrand(product) !== state.brand) return false;
      if (term) {
        const searchable = [
          product.Item_Name_MM, product.Item_Name_EN, product.Brand_MM, product.Brand_EN,
          product.Variant_MM, product.Variant_EN, product.SKU_ID
        ].map(clean).join(" ").toLocaleLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    }).sort((a, b) => {
      const orderA = Number(a.Sort_Order) || 999999;
      const orderB = Number(b.Sort_Order) || 999999;
      return orderA - orderB || getProductName(a).localeCompare(getProductName(b));
    });
  }

  function productCard(product) {
    const name = getProductName(product);
    const englishName = getEnglishName(product);
    const brand = getBrand(product);
    const variant = languageValue(product.Variant_MM, product.Variant_EN);
    const sizeValue = clean(product.Size_Value);
    const sizeUnit = clean(product.Size_Unit);
    const pack = clean(product.Pack_Type);

    const unit = [
        [sizeValue, sizeUnit].filter(Boolean).join(" "),
        pack
    ].filter(Boolean).join(" ");
    const available = isAvailable(product.Available);
    const category = categoryName(product);
    const price = formatPrice(product.Price_MMK);

    return `
      <article class="product-card">
        <div class="product-top">
          <span class="product-category">${escapeHTML(category)}</span>
          <span class="stock ${available ? "" : "unavailable"}">${available ? translations[state.language].available : translations[state.language].unavailable}</span>
        </div>
        <div class="product-name">${escapeHTML(name)}</div>
        ${state.language === "my" && englishName && englishName !== name
          ? `<div class="product-name-en">${escapeHTML(englishName)}</div>` : ""}
        ${brand ? `<div class="product-brand">${escapeHTML(brand)}</div>` : ""}
        ${variant ? `<div class="product-variant">${escapeHTML(variant)}</div>` : ""}
        <div class="product-bottom">
          <div class="product-price">${escapeHTML(price)}</div>
          ${unit ? `<div class="product-unit">${escapeHTML(unit)}</div>` : ""}
        </div>
      </article>`;
  }

  function renderProducts() {
    const products = filteredProducts();
    const grid = $("#productGrid");
    grid.innerHTML = products.map(productCard).join("");
    $("#emptyState").hidden = products.length > 0;
    grid.hidden = products.length === 0;
    $("#resultCount").textContent = `${products.length.toLocaleString()} ${translations[state.language].items}`;
    $("#clearSearch").hidden = !state.search;
  }

  async function loadProducts() {
    if (state.loading) return;
    state.loading = true;
    $("#refreshButton").disabled = true;
    $("#productGrid").hidden = false;
    $("#emptyState").hidden = true;
    $("#productGrid").innerHTML = `<div class="loading-card"><span class="loader"></span><p>${escapeHTML(translations[state.language].loading)}</p></div>`;

    try {
      // const response = await fetch(API_URL, { headers: { Accept: "application/json" }, cache: "no-store" });
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // const result = await response.json();
      const result = await requestJSONP(API_URL, {
        action: "products"
      });
      if (!result.success || !Array.isArray(result.data)) throw new Error(result.message || "Invalid API response");
      state.products = result.data;
      state.categories = Array.isArray(result.categories) ? result.categories : [];
      state.error = "";
      renderFilters();
      renderProducts();
      const updated = result.updatedAt ? new Date(result.updatedAt) : new Date();
      $("#lastUpdated").textContent = `${translations[state.language].updated}: ${updated.toLocaleString(state.language === "en" ? "en-US" : "my-MM")}`;
    } catch (error) {
      console.error("Product API error:", error);
      state.error = error.message;
      $("#productGrid").innerHTML = `<div class="loading-card"><p>${escapeHTML(translations[state.language].loadError)}</p><small>${escapeHTML(error.message)}</small></div>`;
      $("#resultCount").textContent = "API error";
    } finally {
      state.loading = false;
      $("#refreshButton").disabled = false;
    }
  }

  $("#languageToggle").addEventListener("click", () => setLanguage(state.language === "my" ? "en" : "my"));
  $("#searchInput").addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderProducts();
  });
  $("#clearSearch").addEventListener("click", () => {
    $("#searchInput").value = "";
    state.search = "";
    renderProducts();
    $("#searchInput").focus();
  });
  $("#categoryFilter").addEventListener("change", (event) => {
    state.category = event.target.value;
    renderFilters();
    renderProducts();
  });
  $("#subcategoryFilter").addEventListener("change", (event) => {
    state.subcategory = event.target.value;
    renderProducts();
  });
  $("#brandFilter").addEventListener("change", (event) => {
    state.brand = event.target.value;
    renderProducts();
  });
  $("#refreshButton").addEventListener("click", loadProducts);
  $("#resetFilters").addEventListener("click", () => {
    state.search = "";
    state.category = "all";
    state.subcategory = "all";
    state.brand = "all";
    $("#searchInput").value = "";
    renderFilters();
    renderProducts();
  });

  setLanguage(state.language);
  loadProducts();
})();
