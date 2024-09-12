function modifyPrices() {
  const priceElements = document.querySelectorAll('p.chakra-text.css-x4xr8c');
  
  priceElements.forEach(element => {
    if (!element.dataset.modified) {
      const originalText = element.textContent.trim();
      const numericValue = originalText.replace(/[^0-9,]/g, '').replace(',', '.');
      
      const formattedPrice = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parseFloat(numericValue));

      element.textContent = formattedPrice + ' ARS';
      element.dataset.modified = 'true';
      
      console.log(`Modified price: ${originalText} -> ${element.textContent}`);
    }
  });
}

function initPriceModifier() {
  modifyPrices();
  
  // Observar cambios en el DOM para modificar precios dinámicos
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        modifyPrices();
      }
    });
  });

  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Ejecutar cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPriceModifier);
} else {
  initPriceModifier();
}

// También ejecutar después de 2 segundos por si hay contenido cargado dinámicamente
setTimeout(initPriceModifier, 2000);

function addDiscountMessage() {
  const priceElements = document.querySelectorAll('p.chakra-text.css-x4xr8c');
  
  priceElements.forEach(element => {
    if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('discount-message')) {
      const discountMessage = document.createElement('p');
      discountMessage.textContent = '¡10% OFF haciendo el pedido por WhatsApp y pagando por transferencia!';
      discountMessage.style.fontSize = '0.8em';
      discountMessage.style.color = '#4CAF50';
      discountMessage.style.marginTop = '0.2em';
      discountMessage.style.fontWeight = 'bold';
      discountMessage.classList.add('discount-message');

      element.parentNode.insertBefore(discountMessage, element.nextSibling);
    }
  });
}

function initDiscountMessage() {
  addDiscountMessage();
  
  // Observar cambios en el DOM para añadir mensajes a precios dinámicos
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        addDiscountMessage();
      }
    });
  });

  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Ejecutar cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiscountMessage);
} else {
  initDiscountMessage();
}

// También ejecutar después de 2 segundos por si hay contenido cargado dinámicamente
setTimeout(initDiscountMessage, 2000);