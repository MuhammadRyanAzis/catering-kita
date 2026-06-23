import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hash(pw, 10)

// ─── Data ────────────────────────────────────────────────────────────────────
const VENDOR_PASSWORD = 'Vendor@123'

const CATEGORIES = [
  { name: 'Nasi & Lauk', description: 'Hidangan nasi dengan berbagai pilihan lauk pauk' },
  { name: 'Ayam & Unggas', description: 'Olahan ayam, bebek, dan unggas lainnya' },
  { name: 'Seafood', description: 'Aneka hidangan hasil laut segar' },
  { name: 'Sayuran & Vegetarian', description: 'Menu sehat berbahan dasar sayuran' },
  { name: 'Sup & Soto', description: 'Berbagai jenis sup, soto, dan kuah' },
  { name: 'Bakaran & Panggang', description: 'Menu yang dimasak dengan cara dibakar' },
  { name: 'Minuman', description: 'Minuman segar dan hangat' },
  { name: 'Dessert & Snack', description: 'Makanan ringan dan penutup' },
]

const VENDORS = [
  {
    email: 'dapur.bu.sari@cateringkita.com',
    name: 'Sari Kusuma',
    vendor: {
      name: 'Dapur Bu Sari',
      description: 'Catering masakan rumahan Jawa yang autentik. Kami menggunakan bumbu rempah pilihan dari tangan para ibu berpengalaman selama lebih dari 15 tahun. Rasakan cita rasa masakan rumah yang penuh kehangatan.',
      address: 'Jl. Kaliurang No. 45, Sleman',
      city: 'Yogyakarta',
      phone: '081234567001',
      subscription_price_7: 450000,
      subscription_price_30: 1500000,
    },
    menus: [
      { name: 'Nasi Gudeg Komplit', cat: 'Nasi & Lauk', price: 28000, cal: 620, desc: 'Gudeg jogja legendaris dengan nangka muda empuk, telur pindang, ayam kampung, sambal krecek, dan areh santan kental. Disajikan dengan nasi pulen hangat.' },
      { name: 'Nasi Pecel Jawa', cat: 'Sayuran & Vegetarian', price: 18000, cal: 410, desc: 'Sayuran rebus segar (bayam, kangkung, kecambah, kemangi) disiram bumbu kacang Madiun yang kaya, dilengkapi peyek udang dan tempe goreng.' },
      { name: 'Ayam Ingkung Kampung', cat: 'Ayam & Unggas', price: 45000, cal: 510, desc: 'Ayam kampung utuh dimasak dengan santan dan bumbu rempah khas Jawa hingga meresap sempurna. Sajian khas hajatan yang bisa dinikmati setiap hari.' },
      { name: 'Soto Ayam Lamongan', cat: 'Sup & Soto', price: 22000, cal: 380, desc: 'Kuah bening kunyit segar dengan suwiran ayam kampung, telur rebus, dan taburan soun plus koya gurih khas Lamongan yang bikin nagih.' },
      { name: 'Tempe Bacem Manis', cat: 'Sayuran & Vegetarian', price: 8000, cal: 195, desc: 'Tempe dimasak dengan gula jawa dan rempah hingga meresap, lalu digoreng kering. Manis, gurih, dan cocok sebagai lauk pendamping.' },
      { name: 'Es Dawet Ayu', cat: 'Minuman', price: 12000, cal: 230, desc: 'Minuman tradisional Jawa dengan cendol hijau pandan, santan segar, dan gula merah cair. Menyegarkan di siang hari.' },
    ],
  },
  {
    email: 'warung.mak.ijah@cateringkita.com',
    name: 'Fatimah Azzahra',
    vendor: {
      name: 'Warung Mak Ijah',
      description: 'Spesialis masakan Minangkabau asli Padang. Kami membawa cita rasa Ranah Minang langsung ke meja makan Anda dengan santan segar pilihan dan cabai yang diolah secara tradisional setiap harinya.',
      address: 'Jl. Teuku Umar No. 12, Menteng',
      city: 'Jakarta',
      phone: '081234567002',
      subscription_price_7: 525000,
      subscription_price_30: 1800000,
    },
    menus: [
      { name: 'Nasi Rendang Daging', cat: 'Nasi & Lauk', price: 42000, cal: 680, desc: 'Rendang daging sapi autentik dimasak lebih dari 6 jam dengan santan dan 12 jenis rempah pilihan hingga kering dan berwarna coklat kehitaman. Juara!' },
      { name: 'Ayam Pop Padang', cat: 'Ayam & Unggas', price: 32000, cal: 420, desc: 'Ayam kampung rebus dengan bumbu minimal, digoreng sebentar hingga putih keemasan. Disajikan dengan sambal balado merah yang pedas menggigit.' },
      { name: 'Gulai Ikan Kakap', cat: 'Seafood', price: 38000, cal: 450, desc: 'Ikan kakap segar dimasak dalam gulai santan dengan asam kandis, kunyit, lengkuas, dan cabai hijau. Kuahnya kental dan aromanya sangat menggugah.' },
      { name: 'Sayur Daun Singkong Santan', cat: 'Sayuran & Vegetarian', price: 15000, cal: 210, desc: 'Daun singkong muda yang empuk dimasak dalam santan gurih dengan teri Medan, cabai hijau, dan serai. Sederhana tapi autentik.' },
      { name: 'Dendeng Balado', cat: 'Nasi & Lauk', price: 35000, cal: 390, desc: 'Irisan daging sapi tipis yang digoreng kering lalu ditumis dengan balado cabai merah dan bawang. Tekstur crispy dengan rasa pedas memikat.' },
      { name: 'Es Teh Tawar Dingin', cat: 'Minuman', price: 8000, cal: 5, desc: 'Teh hitam tanpa gula yang diseduh pekat dan disajikan dengan es batu segar. Cocok menemani santapan berat khas Padang.' },
    ],
  },
  {
    email: 'seafood.pak.budi@cateringkita.com',
    name: 'Budiman Santosa',
    vendor: {
      name: 'Seafood Pak Budi Segar',
      description: 'Catering seafood dengan kesegaran terjamin. Kami mendapatkan pasokan langsung dari nelayan setiap pagi dari Pelabuhan Muara Baru. Nikmati cita rasa laut yang segar di mana saja.',
      address: 'Jl. Pantai Indah No. 8, Penjaringan',
      city: 'Jakarta',
      phone: '081234567003',
      subscription_price_7: 600000,
      subscription_price_30: 2100000,
    },
    menus: [
      { name: 'Kepiting Saus Padang', cat: 'Seafood', price: 85000, cal: 420, desc: 'Kepiting laut segar ukuran besar dimasak dengan saus padang yang pedas dan harum. Dagingnya padat, manis alami, dan penuh cita rasa laut.' },
      { name: 'Udang Galah Bakar Madu', cat: 'Bakaran & Panggang', price: 65000, cal: 290, desc: 'Udang galah besar dibakar dengan olesan madu, kecap manis, dan bawang putih. Kulitnya sedikit gosong tapi dagingnya juicy dan manis.' },
      { name: 'Ikan Bawal Bakar Kecap', cat: 'Bakaran & Panggang', price: 48000, cal: 340, desc: 'Ikan bawal segar pilihan dibakar dengan bumbu kecap manis, cabai rawit, dan jeruk nipis. Tekstur dagingnya lembut dan tidak amis.' },
      { name: 'Cumi Goreng Tepung Crispy', cat: 'Seafood', price: 38000, cal: 380, desc: 'Cumi segar dipotong ring, dilapis tepung berbumbu dengan sedikit jahe, lalu digoreng hingga kekuningan renyah. Disajikan dengan saus tartar.' },
      { name: 'Sup Tom Yam Seafood', cat: 'Sup & Soto', price: 45000, cal: 310, desc: 'Sup ala Thailand dengan udang, cumi, dan kerang dalam kuah asam segar serai, daun jeruk, dan galangal. Pedas segar dan menghangatkan.' },
      { name: 'Es Kelapa Muda Segar', cat: 'Minuman', price: 18000, cal: 140, desc: 'Air kelapa muda asli yang segar disajikan langsung dalam tempurungnya. Menyegarkan dan alami tanpa pemanis tambahan.' },
    ],
  },
  {
    email: 'lunchbox.healthy@cateringkita.com',
    name: 'Anindita Rahayu',
    vendor: {
      name: 'Healthy Bowl by Anin',
      description: 'Menu makan siang sehat dan lezat untuk para profesional. Kami menggunakan bahan organik lokal, rendah gula, rendah garam, dan bebas MSG. Semua dikemas dalam boks ramah lingkungan yang instagramable.',
      address: 'Jl. Sudirman Kav. 52, Senayan',
      city: 'Jakarta',
      phone: '081234567004',
      subscription_price_7: 550000,
      subscription_price_30: 1950000,
    },
    menus: [
      { name: 'Salmon Teriyaki Bowl', cat: 'Nasi & Lauk', price: 58000, cal: 490, desc: 'Fillet salmon premium dipanggang dan disiram saus teriyaki rendah sodium. Disajikan di atas nasi merah organik dengan edamame dan brokoli kukus.' },
      { name: 'Grilled Chicken Caesar Wrap', cat: 'Ayam & Unggas', price: 45000, cal: 420, desc: 'Ayam dada panggang iris dengan selada romaine segar, parmesan, crouton gandum utuh, dan saus Caesar light. Dibungkus tortilla whole wheat.' },
      { name: 'Buddha Bowl Quinoa', cat: 'Sayuran & Vegetarian', price: 52000, cal: 380, desc: 'Mangkuk penuh nutrisi dengan quinoa, chickpea panggang, alpukat segar, wortel parut, timun, dan tahini dressing lemon. Vegan dan gluten-friendly.' },
      { name: 'Tuna Salad Sandwich', cat: 'Nasi & Lauk', price: 38000, cal: 350, desc: 'Tuna chunk dengan mayonnaise rendah lemak, daun selada, tomat, dan timun di antara roti gandum utuh panggang. Tinggi protein, rendah kalori.' },
      { name: 'Smoothie Bowl Acai', cat: 'Dessert & Snack', price: 42000, cal: 280, desc: 'Puree acai premium dengan pisang dan stroberi, ditaburi granola renyah, biji chia, madu organik, dan potongan buah segar musiman.' },
      { name: 'Infused Water Timun Mint', cat: 'Minuman', price: 15000, cal: 12, desc: 'Air mineral infus alami dengan irisan timun segar dan daun mint. Menyegarkan, detoks, dan cocok untuk diet hidrasimu sehari-hari.' },
    ],
  },
  {
    email: 'bebek.goreng.haji@cateringkita.com',
    name: 'Haji Mahmud Fauzi',
    vendor: {
      name: 'Bebek Goreng H. Mahmud',
      description: 'Bebek goreng krispi legendaris dengan resep turun-temurun dari Madura. Sudah berdiri sejak 1989 dan melayani ribuan pelanggan setia. Bebek kami selalu empuk, tidak bau amis, dengan kulit super krispi.',
      address: 'Jl. KH. Wahid Hasyim No. 90, Gambir',
      city: 'Jakarta',
      phone: '081234567005',
      subscription_price_7: 480000,
      subscription_price_30: 1650000,
    },
    menus: [
      { name: 'Bebek Goreng Krispi Komplit', cat: 'Ayam & Unggas', price: 52000, cal: 730, desc: 'Setengah bebek empuk digoreng krispi dengan bumbu kunyit, ketumbar, dan serai yang diungkep semalam. Disajikan dengan nasi, sambal korek, dan lalapan.' },
      { name: 'Nasi Bebek Madura', cat: 'Nasi & Lauk', price: 48000, cal: 695, desc: 'Paha bebek goreng khas Madura dengan bumbu hitam gelap yang kaya rempah. Disajikan di atas nasi hangat dengan sambal pedas dan mentimun segar.' },
      { name: 'Bebek Bakar Bumbu Rujak', cat: 'Bakaran & Panggang', price: 55000, cal: 620, desc: 'Bebek diungkep lembut lalu dibakar dengan bumbu rujak pedas manis yang karamelisasi di atas bara. Aromanya menggoda, rasanya kompleks.' },
      { name: 'Ceker Bebek Woku', cat: 'Ayam & Unggas', price: 25000, cal: 290, desc: 'Ceker bebek dimasak woku khas Manado dengan kemangi, tomat, cabai, dan serai. Kuahnya kuning segar dan rasanya menggigit pedas menyenangkan.' },
      { name: 'Soto Bebek Kuah Bening', cat: 'Sup & Soto', price: 32000, cal: 340, desc: 'Suwiran bebek kampung dalam kuah bening kunyit yang segar. Dilengkapi soun, tomat, daun bawang, dan bawang goreng crispy di atasnya.' },
      { name: 'Jus Alpukat Krim', cat: 'Minuman', price: 18000, cal: 280, desc: 'Alpukat matang pilihan diblender dengan susu segar dan sedikit gula. Kental, creamy, dan mengenyangkan. Teman sempurna makan bebek goreng.' },
    ],
  },
  {
    email: 'nasi.padang.sederhana@cateringkita.com',
    name: 'Rudi Hermansyah',
    vendor: {
      name: 'RM Sederhana Pak Rudi',
      description: 'Rumah makan Padang dengan pengalaman lebih dari 20 tahun. Kami menyajikan masakan Minang dengan cara masak tradisional menggunakan kayu bakar dan santan segar kelapa asli, bukan santan kemasan.',
      address: 'Jl. Gatot Subroto No. 33, Kebayoran',
      city: 'Jakarta',
      phone: '081234567006',
      subscription_price_7: 465000,
      subscription_price_30: 1575000,
    },
    menus: [
      { name: 'Nasi Padang Komplit', cat: 'Nasi & Lauk', price: 35000, cal: 720, desc: 'Nasi putih pulen dengan pilihan 5 lauk: rendang, ayam pop, perkedel, sayur nangka, dan sambal lado. Kuah gulai disajikan terpisah.' },
      { name: 'Ayam Goreng Serundeng', cat: 'Ayam & Unggas', price: 28000, cal: 480, desc: 'Potongan ayam kampung digoreng renyah, ditaburi serundeng kelapa yang harum dan sedikit manis. Tekstur kontras yang bikin ketagihan.' },
      { name: 'Gulai Tunjang', cat: 'Sup & Soto', price: 40000, cal: 510, desc: 'Kikil sapi yang dimasak lama dalam gulai santan kental dengan campuran rempah dan cabai hijau. Gelatin kikil yang kenyal dalam kuah yang kaya rasa.' },
      { name: 'Pindang Ikan Tongkol', cat: 'Seafood', price: 30000, cal: 310, desc: 'Ikan tongkol segar dimasak dalam bumbu pindang asam pedas dengan belimbing wuluh, tomat merah, dan kunyit. Segar dan ringan.' },
      { name: 'Dadar Gulung Pandan', cat: 'Dessert & Snack', price: 10000, cal: 185, desc: 'Crepe tipis berwarna hijau dari ekstrak daun pandan asli, diisi unti kelapa gula merah yang manis dan wangi. Kudapan tradisional yang tak lekang waktu.' },
      { name: 'Teh Talua Minang', cat: 'Minuman', price: 14000, cal: 165, desc: 'Teh hitam pekat dengan campuran kuning telur ayam kampung, jeruk nipis, dan gula. Minuman tradisional Minang yang bergizi dan menghangatkan.' },
    ],
  },
  {
    email: 'vegetarian.dewi@cateringkita.com',
    name: 'Dewi Kusumawati',
    vendor: {
      name: 'Vegetarian Dewi Kitchen',
      description: 'Catering vegetarian dan vegan dengan cita rasa yang tidak membosankan. Kami membuktikan bahwa makanan tanpa daging bisa sangat lezat dan mengenyangkan. Cocok untuk keluarga, perusahaan, dan acara formal.',
      address: 'Jl. Diponegoro No. 28, Gondokusuman',
      city: 'Yogyakarta',
      phone: '081234567007',
      subscription_price_7: 420000,
      subscription_price_30: 1400000,
    },
    menus: [
      { name: 'Nasi Campur Vegetarian', cat: 'Nasi & Lauk', price: 25000, cal: 490, desc: 'Nasi dengan lauk vegetarian: tempe bacem, tahu crispy, orek tempe, sayur asem, perkedel jagung, dan sambal matah. Lengkap dan bergizi.' },
      { name: 'Gado-Gado Jakarta', cat: 'Sayuran & Vegetarian', price: 22000, cal: 380, desc: 'Aneka sayuran rebus, tahu, tempe, dan telur rebus disiram bumbu kacang segar dan gurih. Ditaburi kerupuk dan bawang goreng. Klasik dan memuaskan.' },
      { name: 'Capcay Goreng Tofu', cat: 'Sayuran & Vegetarian', price: 20000, cal: 285, desc: 'Sayuran berwarna-warni (wortel, brokoli, baby corn, paprika, jamur) ditumis dengan tofu dan saus tiram vegetarian. Crispy dan segar.' },
      { name: 'Sup Krim Jagung Manis', cat: 'Sup & Soto', price: 18000, cal: 220, desc: 'Sup krim lembut dari jagung manis segar dengan sedikit krim nabati, lada hitam, dan taburan daun seledri. Hangat, ringan, dan menenangkan.' },
      { name: 'Martabak Sayur Tahu', cat: 'Dessert & Snack', price: 16000, cal: 310, desc: 'Martabak tipis renyah berisi tumisan tahu, daun bawang, wortel, kubis, dan bumbu kari. Cocok sebagai cemilan sore yang mengenyangkan.' },
      { name: 'Jus Wortel Jahe Segar', cat: 'Minuman', price: 14000, cal: 95, desc: 'Wortel segar diblender dengan sedikit jahe dan jeruk peras. Kaya beta-karoten, antioksidan, dan menyegarkan. Tanpa gula tambahan.' },
    ],
  },
  {
    email: 'iga.bakar.sultan@cateringkita.com',
    name: 'Sultan Ardiansyah',
    vendor: {
      name: 'Iga Bakar Sultan',
      description: 'Spesialis iga sapi dan daging premium sejak 2015. Kami menggunakan iga wagyu lokal grade A dengan proses slow cooking 8 jam untuk menghasilkan daging yang rontok dari tulang dengan rasa yang sangat kaya.',
      address: 'Jl. Kertajaya No. 66, Gubeng',
      city: 'Surabaya',
      phone: '081234567008',
      subscription_price_7: 700000,
      subscription_price_30: 2500000,
    },
    menus: [
      { name: 'Iga Bakar BBQ Premium', cat: 'Bakaran & Panggang', price: 95000, cal: 780, desc: 'Setengah rack iga sapi wagyu lokal dimasak slow cook 8 jam, lalu dibakar di atas arang dengan saus BBQ asap yang dibuat dari bawang putih caramel dan asam jawa.' },
      { name: 'Nasi Iga Penyet', cat: 'Nasi & Lauk', price: 68000, cal: 690, desc: 'Iga sapi goreng krispi dengan bumbu Madura dipenyet bersama sambal bawang super pedas. Disajikan dengan lalapan, tempe goreng, dan nasi panas.' },
      { name: 'Sup Iga Bening Segar', cat: 'Sup & Soto', price: 72000, cal: 520, desc: 'Iga sapi empuk dalam kuah bening jernih yang dimasak 4 jam dengan jahe, daun salam, dan bawang putih. Kolagenya tinggi, rasanya bersih dan mewah.' },
      { name: 'Daging Bakar Bumbu Rujak', cat: 'Bakaran & Panggang', price: 78000, cal: 640, desc: 'Sirloin pilihan dimarinasi bumbu rujak pedas manis selama 12 jam, lalu dibakar medium rare. Tekstur dagingnya juicy dengan rasa kompleks yang dalam.' },
      { name: 'Beef Shortrib Teriyaki', cat: 'Nasi & Lauk', price: 88000, cal: 720, desc: 'Short rib sapi empuk yang dimasak braised dalam saus teriyaki premium, disajikan dengan nasi putih hangat, edamame, dan kimchi buatan sendiri.' },
      { name: 'Cola Soda Rempah', cat: 'Minuman', price: 22000, cal: 140, desc: 'Minuman soda artisanal dengan akar manis, kayu manis, dan jeruk yang dibuat sendiri tanpa pengawet. Segar dan cocok menemani daging bakar.' },
    ],
  },
  {
    email: 'nasi.tumpeng.berkah@cateringkita.com',
    name: 'Berkah Sejahtera',
    vendor: {
      name: 'Tumpeng Berkah Catering',
      description: 'Catering khusus nasi tumpeng, prasmanan, dan acara formal. Kami melayani pernikahan, ulang tahun, syukuran, arisan, dan acara korporat. Tim kami berpengalaman dalam penyajian yang elegan dan higienis.',
      address: 'Jl. Pandanaran No. 15, Gajahmungkur',
      city: 'Semarang',
      phone: '081234567009',
      subscription_price_7: 520000,
      subscription_price_30: 1850000,
    },
    menus: [
      { name: 'Paket Nasi Tumpeng Mini', cat: 'Nasi & Lauk', price: 150000, cal: 850, desc: 'Tumpeng kerucut nasi kuning dengan lauk komplet: ayam ingkung, urap sayur, kering tempe, perkedel kentang, serundeng, dan sambal goreng ati. Untuk 4-6 porsi.' },
      { name: 'Nasi Kuning Prasmanan', cat: 'Nasi & Lauk', price: 35000, cal: 680, desc: 'Porsi individual nasi kuning gurih dengan bawang merah goreng, bihun goreng, ayam goreng kuning, dan sambal kering yang harum.' },
      { name: 'Opor Ayam Santan', cat: 'Ayam & Unggas', price: 32000, cal: 490, desc: 'Ayam kampung dalam kuah opor santan putih yang kental dan gurih, kaya rasa rempah (serai, daun salam, kemiri). Klasik acara lebaran yang dihadirkan setiap hari.' },
      { name: 'Semur Daging Betawi', cat: 'Nasi & Lauk', price: 40000, cal: 530, desc: 'Daging sapi dalam saus semur hitam kental berempah dengan pala, cengkeh, kayu manis, dan kecap. Rasa manis gurih khas Betawi yang sangat memanjakan.' },
      { name: 'Lumpia Semarang Basah', cat: 'Dessert & Snack', price: 12000, cal: 175, desc: 'Lumpia basah khas Semarang dengan isian rebung, telur, dan udang ebi dalam kulit crepe tipis. Disajikan dengan kuah kental bawang dan saus asam manis.' },
      { name: 'Wedang Jahe Rempah', cat: 'Minuman', price: 12000, cal: 85, desc: 'Minuman hangat dari jahe emprit yang diperas segar, dicampur gula batu, kayu manis, dan cengkeh. Menghangatkan dan menyehatkan, tersedia untuk 50+ gelas.' },
    ],
  },
  {
    email: 'sunda.asli.garut@cateringkita.com',
    name: 'Asep Saepudin',
    vendor: {
      name: 'Masakan Sunda Garut Asli',
      description: 'Masakan Sunda autentik langsung dari Garut, Jawa Barat. Kami menghadirkan cita rasa alam Priangan dengan sayuran segar dari kebun sendiri, lalapan melimpah, dan sambal yang selalu digiling manual setiap hari.',
      address: 'Jl. Otista No. 77, Cikaret',
      city: 'Bogor',
      phone: '081234567010',
      subscription_price_7: 400000,
      subscription_price_30: 1350000,
    },
    menus: [
      { name: 'Nasi Liwet Sunda Komplit', cat: 'Nasi & Lauk', price: 30000, cal: 640, desc: 'Nasi liwet harum dimasak dalam kastrol tanah liat dengan santan, serai, dan daun salam. Dihidangkan dengan ikan asin, tahu tempe, lalapan, dan sambal terasi.' },
      { name: 'Pepes Ikan Mas Bumbu Tauco', cat: 'Seafood', price: 28000, cal: 290, desc: 'Ikan mas segar dibumbui dengan tauco, tomat, cabai, kemangi, dan daun kunyit, lalu dikukus dalam bungkusan daun pisang. Aromanya luar biasa harum.' },
      { name: 'Ayam Goreng Kuning Sunda', cat: 'Ayam & Unggas', price: 26000, cal: 410, desc: 'Ayam kampung diungkep dengan kunyit, ketumbar, dan bawang putih hingga meresap, lalu digoreng hingga kulitnya kekuningan dan renyah. Autentik Sunda.' },
      { name: 'Karedok Leunca Segar', cat: 'Sayuran & Vegetarian', price: 16000, cal: 230, desc: 'Sayuran mentah segar (leunca, kacang panjang, kol, timun, taoge) disiram sambal kacang khas Sunda yang ringan dan segar. Berbeda dari gado-gado.' },
      { name: 'Mie Kocok Bandung', cat: 'Sup & Soto', price: 24000, cal: 420, desc: 'Mie kuning tebal dalam kuah kaldu sapi yang kaya kolagen, ditambah kikil empuk, tauge renyah, dan bawang goreng. Hangat dan sangat memuaskan.' },
      { name: 'Bajigur Hangat', cat: 'Minuman', price: 12000, cal: 120, desc: 'Minuman tradisional Sunda dari santan, gula merah, jahe, dan kopi sedikit. Hangat, manis, dan beraroma. Cocok dinikmati saat cuaca dingin atau hujan.' },
    ],
  },
]

// ─── Main seed function ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  Starting CateringKita database seed...\n')

  // 1. Admin account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cateringkita.com'
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123'
  await prisma.users.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: await hash(adminPassword),
      name: 'Super Admin',
      role: 'ADMIN',
    },
  })
  console.log('✅  Admin account ready →', adminEmail)

  // 2. Categories
  console.log('\n📂  Seeding categories...')
  const categoryMap: Record<string, number> = {}
  for (const cat of CATEGORIES) {
    const existing = await prisma.categories.findFirst({ where: { name: cat.name } })
    if (existing) {
      categoryMap[cat.name] = existing.id
    } else {
      const created = await prisma.categories.create({ data: cat })
      categoryMap[cat.name] = created.id
    }
  }
  console.log(`✅  ${CATEGORIES.length} categories ready`)

  // 3. Vendors + menus
  console.log('\n🏪  Seeding vendors...\n')
  const vendorPassword = await hash(VENDOR_PASSWORD)

  for (const v of VENDORS) {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({ where: { email: v.email } })
    let userId: number

    if (existingUser) {
      userId = existingUser.id
      console.log(`  ↩️  Vendor already exists: ${v.vendor.name}`)
    } else {
      // Create user
      const user = await prisma.users.create({
        data: {
          email: v.email,
          password: vendorPassword,
          name: v.name,
          role: 'VENDOR',
        },
      })
      userId = user.id

      // Create vendor profile
      await prisma.vendors.create({
        data: {
          user_id: userId,
          name: v.vendor.name,
          description: v.vendor.description,
          address: v.vendor.address,
          city: v.vendor.city,
          phone: v.vendor.phone,
          subscription_price_7: v.vendor.subscription_price_7,
          subscription_price_30: v.vendor.subscription_price_30,
          is_active: true,
        },
      })

      console.log(`  ✅  Created: ${v.vendor.name} (${v.vendor.city})`)
    }

    // Get vendor profile id
    const vendorProfile = await prisma.vendors.findUnique({ where: { user_id: userId } })
    if (!vendorProfile) continue

    // Seed menus for this vendor (skip if already seeded)
    const existingMenuCount = await prisma.menus.count({ where: { vendor_id: vendorProfile.id } })
    if (existingMenuCount === 0) {
      for (const menu of v.menus) {
        await prisma.menus.create({
          data: {
            vendor_id: vendorProfile.id,
            category_id: categoryMap[menu.cat] ?? null,
            name: menu.name,
            description: menu.desc,
            price: menu.price,
            calories: menu.cal,
            available: true,
          },
        })
      }
      console.log(`     📋  ${v.menus.length} menus added for ${v.vendor.name}`)
    } else {
      console.log(`     📋  Menus already exist for ${v.vendor.name}, skipping...`)
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  const totalVendors = await prisma.vendors.count()
  const totalMenus = await prisma.menus.count()
  const totalCategories = await prisma.categories.count()

  // 4. Update Images
  console.log('\n📸  Applying beautiful placeholder images...')
  const foodImages = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
    'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80',
  ]
  const vendorBanners = [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&q=80',
    'https://images.unsplash.com/photo-1414235077428-33898ed1e81b?w=1200&q=80',
  ]
  const vendorLogos = [
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80',
    'https://images.unsplash.com/photo-1576867757603-05b134ebc379?w=400&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  ]

  const vendorsList = await prisma.vendors.findMany()
  for (let i = 0; i < vendorsList.length; i++) {
    await prisma.vendors.update({
      where: { id: vendorsList[i].id },
      data: {
        banner_url: vendorBanners[i % vendorBanners.length],
        image_url: vendorLogos[i % vendorLogos.length]
      }
    })
  }

  const menusList = await prisma.menus.findMany()
  for (let i = 0; i < menusList.length; i++) {
    await prisma.menus.update({
      where: { id: menusList[i].id },
      data: { image_url: foodImages[i % foodImages.length] }
    })
  }

  console.log('\n──────────────────────────────────────────')
  console.log('🎉  Seed completed successfully!\n')
  console.log(`   👤  Admin     : ${adminEmail}`)
  console.log(`   🔑  Password  : ${adminPassword}`)
  console.log(`   🏪  Vendors   : ${totalVendors}`)
  console.log(`   🍽️  Menus     : ${totalMenus}`)
  console.log(`   📂  Categories: ${totalCategories}`)
  console.log(`   📸  Images    : Added to all vendors & menus`)
  console.log('\n   🔑  Vendor default password: Vendor@123')
  console.log('──────────────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
