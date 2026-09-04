import { safeParseDate } from './safeDate';

/**
 * Helpers para el catálogo genérico de extras.
 */
export const filterActiveCatalog = (items) =>
  (items || []).filter((i) => i.active);

export const getCatalogItemById = (id, catalogItems) =>
  (catalogItems || []).find(
    (item) => String(item.slug) === String(id) || String(item.id) === String(id)
  ) || null;

export const sumCatalogPrices = (selectedIds, catalogItems) =>
  (selectedIds || []).reduce((total, id) => {
    const item = getCatalogItemById(id, catalogItems);
    if (!item || item.active === false) return total;
    return total + (Number(item.precio) || 0);
  }, 0);

/**
 * Lógica de cálculo de precios y validación de pasos para el proceso de reserva.
 * Soporta tanto el flujo de BookingPage (pasos 1-8) como BudgetPage (pasos 1-9).
 */
export const calculateBookingTotal = (formData, prices, childrenMenusWithPrices) => {
  let total = 0;

  // 1. Cálculo de Niños (Menú + Plus Fin de Semana)
  const menu = childrenMenusWithPrices.find(
    (m) => String(m.id) === String(formData.niños?.menuId)
  );
  const childPrice = Number(menu ? menu.price : 0) || 0;
  let subTotalNiños = childPrice * (Number(formData.niños?.cantidad) || 0);

  if (formData.fecha) {
    const date = safeParseDate(formData.fecha);
    if (date && !isNaN(date.getTime())) {
      const day = date.getDay(); // 0: Dom, 5: Vie, 6: Sáb
      if (day === 0 || day === 5 || day === 6) {
        subTotalNiños += (prices.plusFinDeSemana || 1.5) * (formData.niños?.cantidad || 0);
      }
    }
  }
  total += subTotalNiños;

  // 2. Comida Adultos
  formData.adultos?.comida?.forEach((item) => {
    total += (item.precioUnitario || 0) * (item.cantidad || 0);
  });

  // 3. Extras: Talleres (umbral >=15 niños para precio Plus)
  if (formData.extras?.taller && formData.extras.taller !== 'ninguno') {
    const workshopName = String(formData.extras?.taller || '').toLowerCase();
    const workshop = prices.workshops?.find(
      (w) => String(w.name).toLowerCase() === workshopName
    );

    const isPlus = (formData.niños?.cantidad || 0) >= 15;

    if (workshop) {
      const tallerPrice = isPlus
        ? (workshop.pricePlus > 0 ? workshop.pricePlus : (workshop.priceBase || 0))
        : (workshop.priceBase || 0);
      total += tallerPrice;
    } else {
      total += isPlus
        ? (prices.preciosExtras?.tallerPlus || 30)
        : (prices.preciosExtras?.tallerBase || 25);
    }
  }

  // 4. Personajes (multi-select: hasta 3)
  const personajes = formData.extras?.personajes || [];
  if (personajes.length > 0) {
    const precioUnitario = prices.preciosExtras?.personaje || 40;
    const precioPack3 = prices.preciosExtras?.precioPack3Personajes || 100;
    total += personajes.length === 3 ? precioPack3 : precioUnitario * personajes.length;
  }
  // Legacy Piñata: only charged for reservations created before the catalog
  // feature existed (empty catalogoItemIds + pinata: true from old flow).
  const hasNewCatalogSelection = (formData.extras?.catalogoItemIds || []).length > 0;
  if (formData.extras?.pinata && !hasNewCatalogSelection) {
    total += prices.preciosExtras?.pinata || 15;
  }
  if (formData.extras?.extension === 30) {
    total += prices.preciosExtras?.extension30 || 30;
  }
  if (formData.extras?.extension === 60) {
    total += prices.preciosExtras?.extension60 || 50;
  }

  // 5. Extras del catálogo genérico (incluye Piñata — no es caso especial)
  const activeCatalog = filterActiveCatalog(prices.extrasCatalogo);
  total += sumCatalogPrices(formData.extras?.catalogoItemIds || [], activeCatalog);

  return total;
};

/**
 * Validación de pasos del formulario de BookingPage.
 *
 * Orden actual (BookingPage):
 *   1 → Fecha/Turno
 *   2 → Niños/Menú
 *   3 → Adultos
 *   4 → Talleres (opcional)
 *   5 → Personajes (opcional)
 *   6 → Extras sin validación crítica
 *   7 → Resumen (lectura, siempre válido)
 *   8 → Datos del Responsable
 *   9 → Success
 *
 * Nota: BudgetPage usa su propia función validateStep inline,
 * no depende de esta función para sus steps 8 y 9.
 */
export const validateBookingStep = (step, formData) => {
  // Step 1: Fecha y turno obligatorios
  if (step === 1) return !!(formData.fecha && formData.turno);

  // Step 2: Niños — cantidad mínima 12, máxima 50, y menú obligatorio
  if (step === 2) {
    const kids = formData.niños?.cantidad || 0;
    const menuId = formData.niños?.menuId;
    return kids >= 12 && kids <= 50 && !!menuId;
  }

  // Step 3: Adultos — mínimo 1
  if (step === 3) {
    const adults = formData.adultos?.cantidad || 0;
    return adults > 0 && adults <= 40;
  }

  // Steps 4-5: Talleres y Personajes — opcionales, siempre válidos
  if (step === 4 || step === 5) return true;

  // Step 6: Extras — sin validación crítica (piñata, extensión son toggles)
  if (step === 6) return true;

  // Step 7: Resumen — solo lectura, siempre válido
  if (step === 7) return true;

  // Step 8: Datos del Responsable — todos los campos obligatorios
  if (step === 8) {
    const { nombreNiño, edadNiño, nombrePadre, telefono, email } = formData.cliente || {};
    const cleanPhone = (telefono || '').replace(/\s/g, '');
    let isPhoneValid = cleanPhone.length >= 9 && cleanPhone.length <= 16;
    if (cleanPhone.startsWith('+')) {
      const isSpain = cleanPhone.startsWith('+34');
      if (isSpain) {
        // +34 600000000 → 12 chars total (con prefijo, sin espacios)
        isPhoneValid = cleanPhone.length === 12;
      } else {
        isPhoneValid = cleanPhone.length >= 11 && cleanPhone.length <= 20;
      }
    }
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') && (email || '').length <= 100;
    const isNameValid =
      (nombreNiño || '').length > 0 && (nombreNiño || '').length <= 100 &&
      (nombrePadre || '').length > 0 && (nombrePadre || '').length <= 100;

    return !!(
      isNameValid &&
      edadNiño &&
      parseInt(edadNiño) > 0 &&
      parseInt(edadNiño) <= 99 &&
      isPhoneValid &&
      isEmailValid
    );
  }

  return true;
};

/**
 * Time util for reservations/invitations.
 */
export const getExtendedTimeLabel = (horario) => {
  if (!horario?.inicio || !horario?.fin) return null;
  return { from: horario.inicio, to: horario.fin };
};
