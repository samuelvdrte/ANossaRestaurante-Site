// Regras do cardápio compartilhadas pelas rotas
const CATEGORIAS = ['Promoção do dia', 'Cardápio normal', 'Bebidas', 'Sobremesas'];

const SELOS = [
  'carne-bovina', 'carne-frango', 'carne-suina', 'peixe',
  'vegetariano', 'vegano', 'gluten', 'sem-gluten', 'lactose', 'ovo', 'picante'
];

// Evita combinações contraditórias de selos
function normalizarSelos(lista) {
  const s = new Set((Array.isArray(lista) ? lista : []).filter((x) => SELOS.includes(x)));
  const temCarne = ['carne-bovina', 'carne-frango', 'carne-suina', 'peixe'].some((c) => s.has(c));
  if (temCarne) { s.delete('vegetariano'); s.delete('vegano'); }
  if (s.has('vegano')) s.add('vegetariano');
  if (s.has('gluten')) s.delete('sem-gluten');
  return SELOS.filter((x) => s.has(x));
}

// Aceita só URL http(s) ou imagem em base64 (evita javascript:, etc.)
function imagemValida(img) {
  if (img === '' || img == null) return true;
  if (typeof img !== 'string' || img.length > 4 * 1024 * 1024) return false;
  return /^https?:\/\/\S+$/i.test(img) || /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(img);
}

module.exports = { CATEGORIAS, SELOS, normalizarSelos, imagemValida };
