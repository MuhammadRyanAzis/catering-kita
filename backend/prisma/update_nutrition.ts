import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const menus = await prisma.menus.findMany()
  
  for (const menu of menus) {
    // Generate realistic macro/micronutrients based on calories and name/desc
    const calories = menu.calories || 300
    
    // Roughly: 1g carb = 4 kcal, 1g protein = 4 kcal, 1g fat = 9 kcal
    // We'll distribute randomly but somewhat realistically
    const proteinRatio = 0.20 + (Math.random() * 0.20) // 20-40%
    const fatRatio = 0.20 + (Math.random() * 0.15) // 20-35%
    const carbsRatio = 1 - proteinRatio - fatRatio
    
    const protein = Math.round((calories * proteinRatio) / 4)
    const fat = Math.round((calories * fatRatio) / 9)
    const carbs = Math.round((calories * carbsRatio) / 4)
    
    // Fiber (usually 2-10g), Sugar (usually 1-15g)
    const fiber = Math.round(2 + Math.random() * 8)
    const sugar = Math.round(1 + Math.random() * 14)
    
    // Sodium in mg (usually 300 - 1500mg)
    const sodium = Math.round(300 + Math.random() * 1200)
    
    // Water (usually 40-70%)
    const water = Math.round(40 + Math.random() * 30)
    
    const vitaminsList = ["Vitamin A", "Vitamin B Kompleks", "Vitamin C", "Vitamin D", "Vitamin E"]
    const mineralsList = ["Zat Besi", "Kalsium", "Zinc", "Magnesium", "Kalium"]
    
    const vitamins = `${vitaminsList[Math.floor(Math.random() * vitaminsList.length)]}, ${vitaminsList[Math.floor(Math.random() * vitaminsList.length)]}`
    const minerals = `${mineralsList[Math.floor(Math.random() * mineralsList.length)]}, ${mineralsList[Math.floor(Math.random() * mineralsList.length)]}`

    await prisma.menus.update({
      where: { id: menu.id },
      data: {
        carbs,
        protein,
        fat,
        fiber,
        sugar,
        sodium,
        vitamins: [...new Set(vitamins.split(', '))].join(', '),
        minerals: [...new Set(minerals.split(', '))].join(', '),
        water
      }
    })
  }
  
  console.log(`Updated nutrition facts for ${menus.length} menus!`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
