export const CATEGORY_CONSTANTS = {
  MAX_CATEGORIES: 8,
  MAX_NAME_LENGTH: 30,
  ERROR_MESSAGES: {
    EMPTY_NAME: "El nombre de la categoría no puede estar vacío",
  },
  INFO_MESSAGES: {
    LIMIT_INFO: (current: number) => 
      `${current}/${CATEGORY_CONSTANTS.MAX_CATEGORIES} categorías creadas`,
    CANNOT_CREATE: "Has alcanzado el límite máximo de categorías",
  },
}; 