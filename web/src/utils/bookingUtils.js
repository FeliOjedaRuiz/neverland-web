/**
 * Lógica de cálculo de precios para el proceso de reserva.
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
    // Normalizar fecha para evitar problemas de zona horaria en el cálculo del día
    const date = new Date(formData.fecha.replace(/-/g, '/'));
    if (!isNaN(date.getTime())) {
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

  // 3. Extras: Talleres
  if (formData.extras?.taller && formData.extras.taller !== 'ninguno') {
    const workshopName = String(formData.extras?.taller || '').toLowerCase();
    const workshop = prices.workshops?.find(
      (w) => String(w.name).toLowerCase() === workshopName
    );

    // Umbral de 15 niños (15 = Base, >15 = Plus)
    const isPlus = (formData.niños?.cantidad || 0) > 15;

    if (workshop) {
      total += isPlus ? (workshop.pricePlus || 0) : (workshop.priceBase || 0);
    } else {
      total += isPlus
        ? (prices.preciosExtras?.tallerPlus || 30)
        : (prices.preciosExtras?.tallerBase || 25);
    }
  }

  // 4. Otros Extras
  if (formData.extras?.personaje && formData.extras.personaje !== 'ninguno') {
    total += prices.preciosExtras?.personaje || 40;
  }
  if (formData.extras?.pinata) {
    total += prices.preciosExtras?.pinata || 15;
  }
  if (formData.extras?.extension === 30) {
    total += prices.preciosExtras?.extension30 || 30;
  }
  if (formData.extras?.extension === 60) {
    total += prices.preciosExtras?.extension60 || 50;
  }

  return total;
};

/**
 * Validación de pasos del formulario.
 */
export const validateBookingStep = (step, formData) => {
  if (step === 1) return !!(formData.fecha && formData.turno);

  if (step === 2) {
    const { nombreNiño, edadNiño, nombrePadre, telefono, email } = formData.cliente || {};
    let isPhoneValid = (telefono || '').length >= 9;
    if ((telefono || '').startsWith('+')) isPhoneValid = (telefono || '').length >= 11;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

    return !!(
      nombreNiño &&
      edadNiño &&
      parseInt(edadNiño) > 0 &&
      nombrePadre &&
      isPhoneValid &&
      isEmailValid
    );
  }

  if (step === 4) return (formData.adultos?.cantidad || 0) > 0;

  return true;
};
