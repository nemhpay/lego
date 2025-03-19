// Invoking strict mode
'use strict';

let currentDeals = [];
let currentPagination = {};

// Sélection des éléments du DOM
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const selectSort = document.querySelector('#sort-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');

/**
 * Met à jour les variables globales avec les nouvelles données
 */
/**
 * Met à jour les valeurs globales
 * @param {Array} result - Deals à afficher
 * @param {Object} meta - Infos de pagination
 */
const setCurrentDeals = ({ result, meta }) => {
  if (!result || !Array.isArray(result)) {
    console.error(" setCurrentDeals() - Invalid result:", result);
    return;
  }
  if (!meta || typeof meta !== "object") {
    console.error(" setCurrentDeals() - Invalid meta:", meta);
    return;
  }

  currentDeals = result;
  currentPagination = meta;

  console.log(" Current deals updated:", currentDeals);
  console.log(" Current pagination updated:", currentPagination);
};






/**
 * Récupère les deals de l'API
 */
const fetchDeals = async (page = 1, size = 6, id = null, sort = "price-asc") => {
  try {
    console.log(` Fetching deals from API for page: ${page}, size: ${size}`);

    let url = `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`;
    if (id) url += `&id=${id}`;

    console.log(" Fetching URL:", url);

    const response = await fetch(url);
    
    // Vérification de la réponse HTTP
    if (!response.ok) {
      console.error(" API responded with an error:", response.status, response.statusText);
      return { result: [], meta: { currentPage: page, pageCount: 1, count: 0 } };
    }

    const body = await response.json();
    console.log(" API Full Response:", body);

    // Vérification du format attendu
    if (!body.success || !body.data || !Array.isArray(body.data.result)) {
      console.error(" Invalid API response format:", body);
      return { result: [], meta: { currentPage: page, pageCount: 1, count: 0 } };
    }

    let deals = body.data.result || [];
    let pagination = body.data.meta || { currentPage: page, pageCount: 1, count: 0 };

    console.log(" Processed Deals:", deals);
    console.log(" Processed Meta:", pagination);

    return { result: deals, meta: pagination };
  } catch (error) {
    console.error(" Error fetching deals:", error);
    return { result: [], meta: { currentPage: page, pageCount: 1, count: 0 } };
  }
};


/**
 * Récupère les ventes Vinted pour un ID de set LEGO donné et calcule les statistiques de prix
 * @param {Number} id - Identifiant du set LEGO
 * @return {Object} Liste des ventes Vinted + indicateurs de prix
 */
const fetchVintedSales = async (id) => {
  if (!id) {
    console.warn("No Lego set ID provided for fetching sales.");
    return { sales: [], stats: {} };
  }

  try {
    console.log(`Fetching Vinted sales for Lego set ID: ${id}`);
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);

    if (!response.ok) {
      console.error("Error fetching Vinted sales:", response.status, response.statusText);
      return { sales: [], stats: {} };
    }

    const body = await response.json();

    if (!body.success || !Array.isArray(body.data.result)) {
      console.error("Invalid API response format:", body);
      return { sales: [], stats: {} };
    }

    console.log("Fetched Vinted Sales:", body.data.result);
    
    // Extraction des prix
    const prices = body.data.result.map(sale => sale.price).sort((a, b) => a - b);
    
    // Calcul des statistiques de prix
    const stats = {
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length || 0,
      p5: prices.length > 0 ? prices[Math.floor(prices.length * 0.05)] : 0,
      p25: prices.length > 0 ? prices[Math.floor(prices.length * 0.25)] : 0,
      p50: prices.length > 0 ? prices[Math.floor(prices.length * 0.50)] : 0
    };

    console.log("Computed Price Stats:", stats);

    return { sales: body.data.result, stats };
  } catch (error) {
    console.error("Error fetching Vinted sales:", error);
    return { sales: [], stats: {} };
  }
};







/**
 * Trie les deals en fonction du critère sélectionné
 */
const sortDeals = (deals, sort) => {
  return deals.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return (a.price ?? Infinity) - (b.price ?? Infinity);
      case "price-desc":
        return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      case "date-asc":
        return new Date(a.date ?? 0) - new Date(b.date ?? 0);
      case "date-desc":
        return new Date(b.date ?? 0) - new Date(a.date ?? 0);
      default:
        return 0;
    }
  });
};


/**
 * Affiche les deals dans la section HTML
 */
const renderDeals = (deals) => {
  console.log("Rendering deals:", deals);
  
  if (!deals || !Array.isArray(deals) || deals.length === 0) {
    console.warn(" No deals to display:", deals);
    sectionDeals.innerHTML = "<h2>Deals</h2><p>No deals available.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Affiche les ventes Vinted et les indicateurs de prix
 * @param {Array} sales - Liste des ventes Vinted
 * @param {Object} stats - Indicateurs de prix
 */
const renderVintedSales = (sales, stats) => {
  console.log("Rendering Vinted sales:", sales, stats);
  const salesContainer = document.querySelector("#sales-list");
  const salesStatsContainer = document.querySelector("#sales-stats");

  if (!sales || sales.length === 0) {
    salesContainer.innerHTML = "<p>No Vinted sales available for this set.</p>";
    salesStatsContainer.innerHTML = "";
    return;
  }

  // Affichage des ventes
  const template = sales.map(sale => `
    <div class="sale">
      <a href="${sale.link}" target="_blank">${sale.title}</a>
      <span>Price: ${sale.price}€</span>
    </div>
  `).join('');

  salesContainer.innerHTML = template;

  // Affichage des indicateurs de prix
  salesStatsContainer.innerHTML = `
    <h3>Price Indicators</h3>
    <p>Average Price: ${stats.average.toFixed(2)}€</p>
    <p>P5 Price: ${stats.p5.toFixed(2)}€</p>
    <p>P25 Price: ${stats.p25.toFixed(2)}€</p>
    <p>P50 Price: ${stats.p50.toFixed(2)}€</p>
  `;
};


/**
 * Met à jour le sélecteur de pages
 */
const renderPagination = (pagination = { currentPage: 1, pageCount: 1 }) => {
  console.log("Rendering pagination:", pagination);
  if (!pagination || typeof pagination.currentPage === 'undefined') {
    console.error("Invalid pagination data:", pagination);
    return;
  }

  const { currentPage, pageCount } = pagination;
  const options = Array.from(
    { length: pageCount },
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};


/**
 * Met à jour le sélecteur d'ID de set LEGO
 */
const renderLegoSetIds = (deals) => {
  if (!deals || !Array.isArray(deals) || deals.length === 0) {
    console.warn("No valid deals for renderLegoSetIds", deals);
    return;
  }

  const ids = getIdsFromDeals(deals);
  if (!Array.isArray(ids)) {
    console.warn("getIdsFromDeals returned invalid data:", ids);
    return;
  }

  const options = ids.map(id => `<option value="${id}">${id}</option>`).join('');

  selectLegoSetIds.innerHTML = options;
};


/**
 * Met à jour les indicateurs
 */
const renderIndicators = (pagination = { count: 0 }) => {
  console.log("Rendering indicators:", pagination);

  if (!pagination || typeof pagination.count === 'undefined') {
    console.error("Invalid pagination data:", pagination);
    return;
  }

  const { count } = pagination;

  spanNbDeals.innerHTML = count;
};


/**
 * Fonction principale d'affichage
 */
const render = (deals, pagination) => {
  console.log("Rendering function called with:", deals, pagination);
  
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals);
};

// Sélection des boutons
const filterDiscountButton = document.querySelector("#filter-discount");
const filterCommentsButton = document.querySelector("#filter-comments");
const filterDealsButton = document.querySelector("#filter-deals");


// Fonction générique de filtrage
const filterDeals = (condition) => {
  const filteredDeals = currentDeals.filter(condition);
  renderDeals(filteredDeals);
};

// Variable pour suivre l'état du filtre (actif ou non)
let isFilterActive = false;



// Fonction pour filtrer les deals avec une réduction > 50%
const filterByBestDiscount = (deals) => {
    return deals.filter(deal => deal.discount && deal.discount > 50);
};



filterDiscountButton.addEventListener("click", () => {
  filterDeals(deal => deal.discount && deal.discount >= 50);
});

filterCommentsButton.addEventListener("click", () => {
  filterDeals(deal => deal.comments && deal.comments >= 15);
});


// Écouteur pour filtrer les hot deals (température > 100)
filterDealsButton.addEventListener("click", () => {
  filterDeals(deal => deal.temperature && deal.temperature >= 100);
});



/**
 * Listeners pour les interactions utilisateur
 */

// Changement du nombre d'éléments affichés
selectShow.addEventListener('change', async (event) => {
  const size = parseInt(event.target.value);
  const { result, meta } = await fetchDeals(1, size);

  if (!result || !meta) {
    console.error("Failed to fetch deals properly", result, meta);
    return;
  }

  setCurrentDeals({ result, meta });
  render(currentDeals, currentPagination);
});

// Changement de page
// Changement de page
selectPage.addEventListener('change', async (event) => {
  const page = parseInt(event.target.value);
  console.log(`Fetching new deals for page: ${page}, size: ${selectShow.value}`);

  const deals = await fetchDeals(page, parseInt(selectShow.value));

  if (!deals || !deals.result || !Array.isArray(deals.result)) {
    console.error("Invalid deals data received", deals);
    return;
  }

  setCurrentDeals({ result: deals.result, meta: deals.meta });
  console.log("Rendering with updated data:", deals.result, deals.meta);
  render(deals.result, deals.meta);
});



selectLegoSetIds.addEventListener('change', async (event) => {
  const id = event.target.value;
  console.log(`Lego set selected: ${id}`);

  // Récupérer et afficher les deals pour ce set
  const { result, meta } = await fetchDeals(1, parseInt(selectShow.value), id, selectSort.value);
  
  if (!result || !meta) {
    console.error("Failed to fetch deals properly", result, meta);
    return;
  }

  setCurrentDeals({ result, meta });
  render(currentDeals, currentPagination);

  // Récupérer et afficher les ventes Vinted + statistiques
  const { sales, stats } = await fetchVintedSales(id);
  renderVintedSales(sales, stats);
});



// Tri des deals
selectSort.addEventListener("change", async (event) => {
  const sort = event.target.value;
  console.log(`Sorting deals by: ${sort}`);

  // Applique le tri sur les offres actuelles
  const sortedDeals = sortDeals([...currentDeals], sort);

  // Mets à jour l'affichage
  renderDeals(sortedDeals);
});


// Chargement initial des deals
document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();
  
  console.log("Deals fetched on load:", deals);
  
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});