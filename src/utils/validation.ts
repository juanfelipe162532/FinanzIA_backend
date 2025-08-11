import { ObjectId } from 'mongodb';
import prisma from '../config/database';

// Cache para almacenar los mapeos de categorías del sistema
let systemCategoriesCache: { [key: string]: string } = {};
let isCacheInitialized = false;

/**
 * Inicializa el caché de categorías del sistema
 */
async function initializeCategoryCache() {
  if (isCacheInitialized) return;

  try {
    const categories = await prisma.category.findMany({
      where: { isSystem: true },
      select: { id: true, name: true },
    });

    // Mapear nombres de categorías a IDs
    systemCategoriesCache = categories.reduce(
      (acc, category, index) => {
        acc[String(index + 1)] = category.id;
        acc[category.name.toLowerCase()] = category.id;
        return acc;
      },
      {} as { [key: string]: string }
    );

    isCacheInitialized = true;
    console.log('Caché de categorías inicializado:', systemCategoriesCache);
  } catch (error) {
    console.error('Error inicializando caché de categorías:', error);
    throw new Error('No se pudieron cargar las categorías del sistema');
  }
}

/**
 * Valida y normaliza un ID de categoría
 * @param categoryId El ID de categoría a validar
 * @returns El ID de categoría normalizado o lanza un error
 */
export async function validateCategoryId(categoryId: string): Promise<string> {
  if (!categoryId) {
    throw new Error('Se requiere un ID de categoría');
  }

  // Inicializar caché si es necesario
  if (!isCacheInitialized) {
    await initializeCategoryCache();
  }

  // Si es un ObjectId válido, verificar que exista
  if (ObjectId.isValid(categoryId)) {
    return categoryId; // Asumimos que el ID es válido y existe
  }

  // Intentar encontrar en caché por ID numérico o nombre
  const normalizedId = categoryId.toString().toLowerCase().trim();
  const cachedCategoryId = systemCategoriesCache[normalizedId];
  if (cachedCategoryId) {
    return cachedCategoryId;
  }

  // Si no está en caché, verificar en la base de datos
  try {
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: categoryId },
          { name: { equals: categoryId, mode: 'insensitive' } },
          { id: systemCategoriesCache[categoryId] },
        ],
      },
      select: { id: true },
    });

    if (category) {
      // Actualizar caché
      systemCategoriesCache[categoryId] = category.id;
      return category.id;
    }
  } catch (error) {
    console.error('Error validando categoría:', error);
    throw new Error('Error al validar la categoría');
  }

  throw new Error(
    `ID de categoría inválido: "${categoryId}". ` +
      'Debe ser un ID de MongoDB válido, un nombre de categoría o un ID numérico del sistema.'
  );
}

/**
 * Obtiene el ID de una categoría por su nombre o ID
 * @param identifier Nombre o ID de la categoría
 * @returns ID de la categoría o undefined si no se encuentra
 */
export async function getCategoryId(identifier: string): Promise<string | undefined> {
  try {
    return await validateCategoryId(identifier);
  } catch (error) {
    return undefined;
  }
}
