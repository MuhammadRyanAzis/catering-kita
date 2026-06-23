import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const foodImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', // salad bowl
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', // meat / kebab
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', // pizza / flatbread
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80', // cake / dessert
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80', // healthy salad
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', // colorful salad
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80', // pasta
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=800&q=80', // burger / food
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // steak / dining
  'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80', // meat
  'https://images.unsplash.com/photo-1484723091791-c0e7e53c979a?w=800&q=80', // pancakes
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80', // fish / meal
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', // salmon
  'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80', // meatballs
  'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&q=80', // soup/breakfast
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80', // chicken
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', // bowl
  'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=800&q=80', // asian dish
  'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80', // bread/toast
  'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&q=80', // seafood
]

const vendorBanners = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&q=80',
  'https://images.unsplash.com/photo-1414235077428-33898ed1e81b?w=1200&q=80',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80',
]

const vendorLogos = [
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80',
  'https://images.unsplash.com/photo-1576867757603-05b134ebc379?w=400&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=400&q=80',
  'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?w=400&q=80',
]

async function main() {
  const vendors = await prisma.vendors.findMany()
  
  for (let i = 0; i < vendors.length; i++) {
    const bannerUrl = vendorBanners[i % vendorBanners.length]
    const logoUrl = vendorLogos[i % vendorLogos.length]
    
    await prisma.vendors.update({
      where: { id: vendors[i].id },
      data: {
        banner_url: bannerUrl,
        image_url: logoUrl
      }
    })
  }
  
  console.log(`Updated images for ${vendors.length} vendors.`)
  
  const menus = await prisma.menus.findMany()
  
  for (let i = 0; i < menus.length; i++) {
    // try to match category vaguely, but random is fine too.
    const menuImage = foodImages[i % foodImages.length]
    
    await prisma.menus.update({
      where: { id: menus[i].id },
      data: {
        image_url: menuImage
      }
    })
  }
  
  console.log(`Updated images for ${menus.length} menus.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
