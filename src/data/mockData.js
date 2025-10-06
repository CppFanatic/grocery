// Моковые данные для демонстрации

// Функция для получения изображения продукта по категории
const getProductImage = (categoryId) => {
  const imageMap = {
    1: '/images/products/pizza.svg',    // Пицца
    2: '/images/products/burger.svg',   // Бургеры
    3: '/images/products/sushi.svg',    // Суши
    4: '/images/products/pasta.svg',    // Паста
    5: '/images/products/salad.svg',    // Салаты
    6: '/images/products/soup.svg',     // Супы
    7: '/images/products/dessert.svg',  // Десерты
    8: '/images/products/drink.svg',    // Напитки
    9: '/images/products/breakfast.svg', // Завтраки
    10: '/images/products/steak.svg',   // Стейки
    11: '/images/products/sushi.svg',   // Роллы
    12: '/images/products/burger.svg',  // Сэндвичи
    13: '/images/products/sushi.svg',   // Рыба
    14: '/images/products/steak.svg',   // Курица
    15: '/images/products/salad.svg',   // Вегетарианское
    16: '/images/products/pizza.svg',   // Острые блюда
    17: '/images/products/breakfast.svg', // Детское меню
    18: '/images/products/burger.svg',  // Комбо
    19: '/images/products/soup.svg',    // Снэки
    20: '/images/products/dessert.svg'  // Специальные предложения
  };
  return imageMap[categoryId] || '/images/products/pizza.svg';
};

export const categories = [
  { id: 1, name: 'Пицца', description: 'Итальянская пицца', image: '/images/categories/pizza.svg' },
  { id: 2, name: 'Бургеры', description: 'Сочные бургеры', image: '/images/categories/burgers.svg' },
  { id: 3, name: 'Суши', description: 'Японская кухня', image: '/images/categories/sushi.svg' },
  { id: 4, name: 'Паста', description: 'Итальянская паста', image: '/images/categories/pasta.svg' },
  { id: 5, name: 'Салаты', description: 'Свежие салаты', image: '/images/categories/salads.svg' },
  { id: 6, name: 'Супы', description: 'Горячие супы', image: '/images/categories/soups.svg' },
  { id: 7, name: 'Десерты', description: 'Сладкие десерты', image: '/images/categories/desserts.svg' },
  { id: 8, name: 'Напитки', description: 'Прохладительные напитки', image: '/images/categories/drinks.svg' },
  { id: 9, name: 'Завтраки', description: 'Утренние блюда', image: '/images/categories/breakfast.svg' },
  { id: 10, name: 'Стейки', description: 'Мясные стейки', image: '/images/categories/steak.svg' },
  { id: 11, name: 'Роллы', description: 'Японские роллы', image: '/images/categories/sushi.svg' },
  { id: 12, name: 'Сэндвичи', description: 'Быстрые сэндвичи', image: '/images/categories/burgers.svg' },
  { id: 13, name: 'Рыба', description: 'Морепродукты', image: '/images/categories/sushi.svg' },
  { id: 14, name: 'Курица', description: 'Блюда из курицы', image: '/images/categories/steak.svg' },
  { id: 15, name: 'Вегетарианское', description: 'Без мяса', image: '/images/categories/salads.svg' },
  { id: 16, name: 'Острые блюда', description: 'Специи и острота', image: '/images/categories/pizza.svg' },
  { id: 17, name: 'Детское меню', description: 'Для детей', image: '/images/categories/breakfast.svg' },
  { id: 18, name: 'Комбо', description: 'Наборы блюд', image: '/images/categories/burgers.svg' },
  { id: 19, name: 'Снэки', description: 'Закуски', image: '/images/categories/soups.svg' },
  { id: 20, name: 'Специальные предложения', description: 'Акции и скидки', image: '/images/categories/desserts.svg' }
];

export const products = [
  // Пицца (1-10)
  { id: 1, name: 'Маргарита', description: 'Томаты, моцарелла, базилик', price: 450, categoryId: 1, image: getProductImage(1) },
  { id: 2, name: 'Пепперони', description: 'Пепперони, моцарелла, томатный соус', price: 550, categoryId: 1, image: getProductImage(1) },
  { id: 3, name: 'Четыре сыра', description: 'Моцарелла, горгонзола, пармезан, чеддер', price: 600, categoryId: 1, image: getProductImage(1) },
  { id: 4, name: 'Гавайская', description: 'Ветчина, ананас, моцарелла', price: 500, categoryId: 1, image: getProductImage(1) },
  { id: 5, name: 'Карбонара', description: 'Бекон, яйцо, моцарелла, пармезан', price: 580, categoryId: 1, image: getProductImage(1) },
  { id: 6, name: 'Диабло', description: 'Острая салями, перец чили, моцарелла', price: 520, categoryId: 1, image: getProductImage(1) },
  { id: 7, name: 'Вегетарианская', description: 'Овощи, моцарелла, томатный соус', price: 480, categoryId: 1, image: getProductImage(1) },
  { id: 8, name: 'Мясная', description: 'Ветчина, салями, бекон, моцарелла', price: 650, categoryId: 1, image: getProductImage(1) },
  { id: 9, name: 'Морская', description: 'Креветки, мидии, моцарелла', price: 700, categoryId: 1, image: getProductImage(1) },
  { id: 10, name: 'Трюфельная', description: 'Трюфельное масло, грибы, моцарелла', price: 800, categoryId: 1, image: getProductImage(1) },

  // Бургеры (11-20)
  { id: 11, name: 'Классический бургер', description: 'Говядина, салат, помидор, лук', price: 350, categoryId: 2, image: getProductImage(2) },
  { id: 12, name: 'Чизбургер', description: 'Говядина, сыр, салат, помидор', price: 380, categoryId: 2, image: getProductImage(2) },
  { id: 13, name: 'Бекон бургер', description: 'Говядина, бекон, сыр, салат', price: 420, categoryId: 2, image: getProductImage(2) },
  { id: 14, name: 'Чикен бургер', description: 'Курица, салат, помидор, соус', price: 320, categoryId: 2, image: getProductImage(2) },
  { id: 15, name: 'Вегги бургер', description: 'Вегетарианская котлета, овощи', price: 300, categoryId: 2, image: getProductImage(2) },
  { id: 16, name: 'Двойной бургер', description: 'Две котлеты, двойной сыр', price: 450, categoryId: 2, image: getProductImage(2) },
  { id: 17, name: 'Спайси бургер', description: 'Острая котлета, перец, соус', price: 400, categoryId: 2, image: getProductImage(2) },
  { id: 18, name: 'Фиш бургер', description: 'Рыбная котлета, салат, соус', price: 380, categoryId: 2, image: getProductImage(2) },
  { id: 19, name: 'Турки бургер', description: 'Индейка, салат, помидор', price: 360, categoryId: 2, image: getProductImage(2) },
  { id: 20, name: 'Мега бургер', description: 'Три котлеты, бекон, сыр', price: 600, categoryId: 2, image: getProductImage(2) },

  // Суши (21-30)
  { id: 21, name: 'Филадельфия', description: 'Лосось, сливочный сыр, огурец', price: 450, categoryId: 3, image: 'getProductImage(3)' },
  { id: 22, name: 'Калифорния', description: 'Краб, авокадо, огурец', price: 380, categoryId: 3, image: 'getProductImage(3)' },
  { id: 23, name: 'Дракон', description: 'Угорь, авокадо, огурец', price: 500, categoryId: 3, image: 'getProductImage(3)' },
  { id: 24, name: 'Лосось', description: 'Свежий лосось, рис', price: 420, categoryId: 3, image: 'getProductImage(3)' },
  { id: 25, name: 'Тунец', description: 'Свежий тунец, рис', price: 480, categoryId: 3, image: 'getProductImage(3)' },
  { id: 26, name: 'Креветка', description: 'Креветка, рис, васаби', price: 400, categoryId: 3, image: 'getProductImage(3)' },
  { id: 27, name: 'Осьминог', description: 'Осьминог, рис, имбирь', price: 450, categoryId: 3, image: 'getProductImage(3)' },
  { id: 28, name: 'Угорь', description: 'Угорь, рис, соус унаги', price: 520, categoryId: 3, image: 'getProductImage(3)' },
  { id: 29, name: 'Сет суши', description: 'Ассорти из 12 штук', price: 800, categoryId: 3, image: 'getProductImage(3)' },
  { id: 30, name: 'Сашими', description: 'Свежая рыба без риса', price: 600, categoryId: 3, image: 'getProductImage(3)' },

  // Паста (31-40)
  { id: 31, name: 'Карбонара', description: 'Спагетти, бекон, яйцо, пармезан', price: 450, categoryId: 4, image: 'getProductImage(4)' },
  { id: 32, name: 'Болоньезе', description: 'Спагетти, мясной соус, пармезан', price: 420, categoryId: 4, image: 'getProductImage(4)' },
  { id: 33, name: 'Альфредо', description: 'Феттучини, сливочный соус', price: 400, categoryId: 4, image: 'getProductImage(4)' },
  { id: 34, name: 'Песто', description: 'Паста, соус песто, пармезан', price: 380, categoryId: 4, image: 'getProductImage(4)' },
  { id: 35, name: 'Маринара', description: 'Спагетти, томатный соус, базилик', price: 350, categoryId: 4, image: 'getProductImage(4)' },
  { id: 36, name: 'Фрутти ди маре', description: 'Морепродукты, томатный соус', price: 550, categoryId: 4, image: 'getProductImage(4)' },
  { id: 37, name: 'Четыре сыра', description: 'Паста, четыре вида сыра', price: 480, categoryId: 4, image: 'getProductImage(4)' },
  { id: 38, name: 'Арабьята', description: 'Острая паста с перцем', price: 400, categoryId: 4, image: 'getProductImage(4)' },
  { id: 39, name: 'Примавера', description: 'Паста с весенними овощами', price: 420, categoryId: 4, image: 'getProductImage(4)' },
  { id: 40, name: 'Лазанья', description: 'Мясная лазанья с сыром', price: 500, categoryId: 4, image: 'getProductImage(4)' },

  // Салаты (41-50)
  { id: 41, name: 'Цезарь', description: 'Салат, курица, сухарики, соус', price: 350, categoryId: 5, image: 'getProductImage(5)' },
  { id: 42, name: 'Греческий', description: 'Помидоры, огурцы, фета, оливки', price: 320, categoryId: 5, image: 'getProductImage(5)' },
  { id: 43, name: 'Оливье', description: 'Классический салат оливье', price: 280, categoryId: 5, image: 'getProductImage(5)' },
  { id: 44, name: 'Крабовый', description: 'Крабовые палочки, кукуруза', price: 300, categoryId: 5, image: 'getProductImage(5)' },
  { id: 45, name: 'Мимоза', description: 'Рыба, яйца, сыр, майонез', price: 320, categoryId: 5, image: 'getProductImage(5)' },
  { id: 46, name: 'Капрезе', description: 'Моцарелла, помидоры, базилик', price: 380, categoryId: 5, image: 'getProductImage(5)' },
  { id: 47, name: 'Вальдорф', description: 'Яблоки, орехи, сельдерей', price: 350, categoryId: 5, image: 'getProductImage(5)' },
  { id: 48, name: 'Кобб', description: 'Курица, бекон, авокадо, яйцо', price: 400, categoryId: 5, image: 'getProductImage(5)' },
  { id: 49, name: 'Нисуаз', description: 'Тунец, яйца, оливки, фасоль', price: 420, categoryId: 5, image: 'getProductImage(5)' },
  { id: 50, name: 'Азиатский', description: 'Овощи, кунжут, соевый соус', price: 300, categoryId: 5, image: 'getProductImage(5)' },

  // Супы (51-60)
  { id: 51, name: 'Борщ', description: 'Классический украинский борщ', price: 280, categoryId: 6, image: 'getProductImage(6)' },
  { id: 52, name: 'Солянка', description: 'Мясная солянка с лимоном', price: 320, categoryId: 6, image: 'getProductImage(6)' },
  { id: 53, name: 'Куриный бульон', description: 'Домашний куриный бульон', price: 250, categoryId: 6, image: 'getProductImage(6)' },
  { id: 54, name: 'Том ям', description: 'Острый тайский суп с креветками', price: 380, categoryId: 6, image: 'getProductImage(6)' },
  { id: 55, name: 'Минестроне', description: 'Итальянский овощной суп', price: 300, categoryId: 6, image: 'getProductImage(6)' },
  { id: 56, name: 'Гаспачо', description: 'Холодный томатный суп', price: 280, categoryId: 6, image: 'getProductImage(6)' },
  { id: 57, name: 'Лапша удон', description: 'Японская лапша с овощами', price: 350, categoryId: 6, image: 'getProductImage(6)' },
  { id: 58, name: 'Крем-суп грибной', description: 'Сливочный грибной суп', price: 320, categoryId: 6, image: 'getProductImage(6)' },
  { id: 59, name: 'Харчо', description: 'Грузинский острый суп', price: 300, categoryId: 6, image: 'getProductImage(6)' },
  { id: 60, name: 'Фо бо', description: 'Вьетнамский суп с говядиной', price: 400, categoryId: 6, image: 'getProductImage(6)' },

  // Десерты (61-70)
  { id: 61, name: 'Тирамису', description: 'Итальянский десерт с кофе', price: 350, categoryId: 7, image: 'getProductImage(7)' },
  { id: 62, name: 'Чизкейк', description: 'Нью-йоркский чизкейк', price: 320, categoryId: 7, image: 'getProductImage(7)' },
  { id: 63, name: 'Торт Наполеон', description: 'Слоеный торт с кремом', price: 280, categoryId: 7, image: 'getProductImage(7)' },
  { id: 64, name: 'Мороженое', description: 'Ванильное мороженое', price: 150, categoryId: 7, image: 'getProductImage(7)' },
  { id: 65, name: 'Панна котта', description: 'Итальянский десерт с ягодами', price: 300, categoryId: 7, image: 'getProductImage(7)' },
  { id: 66, name: 'Профитроли', description: 'Заварные пирожные с кремом', price: 250, categoryId: 7, image: 'getProductImage(7)' },
  { id: 67, name: 'Брауни', description: 'Шоколадный брауни с орехами', price: 200, categoryId: 7, image: 'getProductImage(7)' },
  { id: 68, name: 'Круассан', description: 'Французский круассан с джемом', price: 120, categoryId: 7, image: 'getProductImage(7)' },
  { id: 69, name: 'Макаруны', description: 'Французские макаруны', price: 180, categoryId: 7, image: 'getProductImage(7)' },
  { id: 70, name: 'Эклер', description: 'Заварное пирожное с кремом', price: 160, categoryId: 7, image: 'getProductImage(7)' },

  // Напитки (71-80)
  { id: 71, name: 'Кока-кола', description: 'Газированный напиток', price: 120, categoryId: 8, image: 'getProductImage(8)' },
  { id: 72, name: 'Сок апельсиновый', description: 'Свежевыжатый апельсиновый сок', price: 150, categoryId: 8, image: 'getProductImage(8)' },
  { id: 73, name: 'Чай зеленый', description: 'Зеленый чай с жасмином', price: 100, categoryId: 8, image: 'getProductImage(8)' },
  { id: 74, name: 'Кофе американо', description: 'Черный кофе', price: 120, categoryId: 8, image: 'getProductImage(8)' },
  { id: 75, name: 'Капучино', description: 'Кофе с молочной пенкой', price: 150, categoryId: 8, image: 'getProductImage(8)' },
  { id: 76, name: 'Латте', description: 'Кофе с большим количеством молока', price: 180, categoryId: 8, image: 'getProductImage(8)' },
  { id: 77, name: 'Мохито', description: 'Безалкогольный мохито', price: 200, categoryId: 8, image: 'getProductImage(8)' },
  { id: 78, name: 'Лимонад', description: 'Домашний лимонад', price: 130, categoryId: 8, image: 'getProductImage(8)' },
  { id: 79, name: 'Смузи ягодный', description: 'Смузи из смешанных ягод', price: 250, categoryId: 8, image: 'getProductImage(8)' },
  { id: 80, name: 'Вода минеральная', description: 'Газированная минеральная вода', price: 80, categoryId: 8, image: 'getProductImage(8)' },

  // Завтраки (81-90)
  { id: 81, name: 'Омлет', description: 'Омлет с зеленью и сыром', price: 250, categoryId: 9, image: 'getProductImage(9)' },
  { id: 82, name: 'Блинчики', description: 'Тонкие блинчики с джемом', price: 200, categoryId: 9, image: 'getProductImage(9)' },
  { id: 83, name: 'Яичница', description: 'Яичница-глазунья с беконом', price: 280, categoryId: 9, image: 'getProductImage(9)' },
  { id: 84, name: 'Каша овсяная', description: 'Овсяная каша с фруктами', price: 180, categoryId: 9, image: 'getProductImage(9)' },
  { id: 85, name: 'Тосты', description: 'Тосты с авокадо и яйцом', price: 220, categoryId: 9, image: 'getProductImage(9)' },
  { id: 86, name: 'Вафли', description: 'Бельгийские вафли с сиропом', price: 300, categoryId: 9, image: 'getProductImage(9)' },
  { id: 87, name: 'Французские тосты', description: 'Тосты в яичной заливке', price: 250, categoryId: 9, image: 'getProductImage(9)' },
  { id: 88, name: 'Гранола', description: 'Гранола с йогуртом и ягодами', price: 200, categoryId: 9, image: 'getProductImage(9)' },
  { id: 89, name: 'Сэндвич завтрак', description: 'Сэндвич с яйцом и беконом', price: 280, categoryId: 9, image: 'getProductImage(9)' },
  { id: 90, name: 'Смузи боул', description: 'Смузи боул с гранолой', price: 320, categoryId: 9, image: 'getProductImage(9)' },

  // Стейки (91-100)
  { id: 91, name: 'Рибай', description: 'Стейк рибай средней прожарки', price: 1200, categoryId: 10, image: 'getProductImage(10)' },
  { id: 92, name: 'Филе миньон', description: 'Нежный стейк из вырезки', price: 1000, categoryId: 10, image: 'getProductImage(10)' },
  { id: 93, name: 'Стриплойн', description: 'Стейк стриплойн с травами', price: 900, categoryId: 10, image: 'getProductImage(10)' },
  { id: 94, name: 'Т-бон', description: 'Стейк Т-бон на косточке', price: 1100, categoryId: 10, image: 'getProductImage(10)' },
  { id: 95, name: 'Стейк из лосося', description: 'Стейк из свежего лосося', price: 800, categoryId: 10, image: 'getProductImage(10)' },
  { id: 96, name: 'Стейк из тунца', description: 'Стейк из тунца с кунжутом', price: 900, categoryId: 10, image: 'getProductImage(10)' },
  { id: 97, name: 'Стейк из баранины', description: 'Стейк из баранины с розмарином', price: 850, categoryId: 10, image: 'getProductImage(10)' },
  { id: 98, name: 'Стейк из свинины', description: 'Стейк из свиной вырезки', price: 600, categoryId: 10, image: 'getProductImage(10)' },
  { id: 99, name: 'Стейк из индейки', description: 'Стейк из индейки с соусом', price: 500, categoryId: 10, image: 'getProductImage(10)' },
  { id: 100, name: 'Стейк из курицы', description: 'Стейк из куриной грудки', price: 400, categoryId: 10, image: 'getProductImage(10)' }
];
