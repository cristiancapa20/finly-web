import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { id: 'cat-alimentacion', name: 'Alimentación', color: '#FF6B6B', icon: '🍔', isSystem: true },
  { id: 'cat-transporte', name: 'Transporte', color: '#4ECDC4', icon: '🚗', isSystem: true },
  { id: 'cat-vivienda', name: 'Vivienda', color: '#45B7D1', icon: '🏠', isSystem: true },
  { id: 'cat-salud', name: 'Salud', color: '#96CEB4', icon: '💊', isSystem: true },
  { id: 'cat-entretenimiento', name: 'Entretenimiento', color: '#FFEAA7', icon: '🎮', isSystem: true },
  { id: 'cat-educacion', name: 'Educación', color: '#DDA0DD', icon: '📚', isSystem: true },
  { id: 'cat-ropa', name: 'Ropa', color: '#F0A500', icon: '👗', isSystem: true },
  { id: 'cat-tecnologia', name: 'Tecnología', color: '#6C5CE7', icon: '💻', isSystem: true },
  { id: 'cat-servicios', name: 'Servicios', color: '#A29BFE', icon: '⚡', isSystem: true },
  { id: 'cat-otros', name: 'Otros', color: '#B2BEC3', icon: '📦', isSystem: true },
]

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { name: category.name, color: category.color, icon: category.icon, isSystem: category.isSystem },
      create: category,
    })
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
