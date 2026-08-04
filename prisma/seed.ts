import {
  OrderStatus,
  PaymentMethod,
  PrismaClient,
  RestaurantType,
  Role,
} from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

const SEED_USER_EMAILS = [
  "admin@fooddelivery.com",
  "courier@fooddelivery.com",
  "ana.kovac@email.com",
  "marko.horvat@email.com",
  "iva.babic@email.com",
] as const;

const SEED_RESTAURANT_NAMES = [
  "Nonna's Trattoria",
  "Dragon Wok",
  "Casa del Sol",
  "Spice Route",
  "Burger Junction",
  "Bella Napoli Express",
] as const;

type MealSeed = {
  name: string;
  description: string;
  price: number;
  images: string[];
};

type RestaurantSeed = {
  name: (typeof SEED_RESTAURANT_NAMES)[number];
  description: string;
  address: string;
  restaurantTypes: RestaurantType[];
  meals: MealSeed[];
};

const restaurantsSeed: RestaurantSeed[] = [
  {
    name: "Nonna's Trattoria",
    description:
      "Family-run Italian kitchen serving handmade pasta, wood-fired pizza, and classic desserts.",
    address: "Ilica 42, 10000 Zagreb",
    restaurantTypes: [RestaurantType.ITALIAN],
    meals: [
      {
        name: "Margherita Pizza",
        description: "San Marzano tomato, fresh mozzarella, basil, olive oil.",
        price: 9.5,
        images: [
          "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
          "https://images.unsplash.com/photo-1604068549275-f1d0a8d4f0c8?w=800",
        ],
      },
      {
        name: "Spaghetti Carbonara",
        description: "Egg yolk, guanciale, pecorino romano, black pepper.",
        price: 11.9,
        images: [
          "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
        ],
      },
      {
        name: "Lasagna al Forno",
        description: "Layered pasta with beef ragu, bechamel, and parmesan.",
        price: 12.5,
        images: [
          "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800",
          "https://images.unsplash.com/photo-1708390359344-0d4b5b5c6c7a?w=800",
        ],
      },
      {
        name: "Chicken Parmigiana",
        description: "Breaded chicken, tomato sauce, melted mozzarella.",
        price: 13.2,
        images: [
          "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800",
        ],
      },
      {
        name: "Tiramisu",
        description: "Espresso-soaked ladyfingers with mascarpone cream.",
        price: 5.9,
        images: [
          "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800",
        ],
      },
      {
        name: "Caprese Salad",
        description: "Tomato, buffalo mozzarella, basil, balsamic glaze.",
        price: 7.8,
        images: [
          "https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=800",
          "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=800",
        ],
      },
    ],
  },
  {
    name: "Dragon Wok",
    description:
      "Cantonese and Sichuan favorites with bold sauces and fresh wok-fried dishes.",
    address: "Vlaška 78, 10000 Zagreb",
    restaurantTypes: [RestaurantType.CHINESE],
    meals: [
      {
        name: "Kung Pao Chicken",
        description: "Chicken, peanuts, chili, and Sichuan peppercorns.",
        price: 10.9,
        images: [
          "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800",
        ],
      },
      {
        name: "Beef Chow Mein",
        description: "Stir-fried noodles with tender beef and vegetables.",
        price: 11.5,
        images: [
          "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800",
          "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
        ],
      },
      {
        name: "Sweet and Sour Pork",
        description: "Crispy pork with pineapple in a tangy sauce.",
        price: 10.5,
        images: [
          "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=800",
        ],
      },
      {
        name: "Vegetable Spring Rolls",
        description: "Crispy rolls filled with cabbage, carrot, and mushrooms.",
        price: 5.5,
        images: [
          "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800",
        ],
      },
      {
        name: "Mapo Tofu",
        description: "Silken tofu in spicy chili bean sauce.",
        price: 9.2,
        images: [
          "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800",
          "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800",
        ],
      },
      {
        name: "Egg Fried Rice",
        description: "Wok-tossed rice with egg, scallions, and soy.",
        price: 6.8,
        images: [
          "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
        ],
      },
      {
        name: "Hot and Sour Soup",
        description: "Classic spicy-sour broth with tofu and mushrooms.",
        price: 4.9,
        images: [
          "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
        ],
      },
    ],
  },
  {
    name: "Casa del Sol",
    description:
      "Vibrant Mexican street food — tacos, burritos, and fresh salsas.",
    address: "Tkalčićeva 15, 10000 Zagreb",
    restaurantTypes: [RestaurantType.MEXICAN, RestaurantType.FAST_FOOD],
    meals: [
      {
        name: "Chicken Tacos",
        description: "Three soft tacos with grilled chicken, salsa, and lime.",
        price: 9.9,
        images: [
          "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800",
          "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
        ],
      },
      {
        name: "Beef Burrito",
        description: "Flour tortilla stuffed with seasoned beef, rice, and beans.",
        price: 11.2,
        images: [
          "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
        ],
      },
      {
        name: "Guacamole & Chips",
        description: "Fresh avocado dip with crispy tortilla chips.",
        price: 6.5,
        images: [
          "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800",
        ],
      },
      {
        name: "Quesadilla",
        description: "Melted cheese quesadilla with pico de gallo.",
        price: 8.8,
        images: [
          "https://images.unsplash.com/photo-1618040996337-569e4e6e8e1c?w=800",
          "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800",
        ],
      },
      {
        name: "Carnitas Bowl",
        description: "Slow-cooked pork, rice, black beans, corn, and salsa.",
        price: 12.0,
        images: [
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
        ],
      },
      {
        name: "Churros",
        description: "Crispy churros dusted with cinnamon sugar.",
        price: 5.2,
        images: [
          "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800",
        ],
      },
    ],
  },
  {
    name: "Spice Route",
    description:
      "North Indian and street-food classics with fragrant spices and fresh naan.",
    address: "Maksimirska 55, 10000 Zagreb",
    restaurantTypes: [RestaurantType.INDIAN],
    meals: [
      {
        name: "Chicken Tikka Masala",
        description: "Grilled chicken in a creamy tomato masala sauce.",
        price: 12.9,
        images: [
          "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
          "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
        ],
      },
      {
        name: "Butter Chicken",
        description: "Tandoori chicken simmered in buttery tomato gravy.",
        price: 13.5,
        images: [
          "https://images.unsplash.com/photo-1603894584372-c69e32b4d4c8?w=800",
        ],
      },
      {
        name: "Palak Paneer",
        description: "Cottage cheese cubes in spiced spinach puree.",
        price: 10.8,
        images: [
          "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
        ],
      },
      {
        name: "Garlic Naan",
        description: "Soft tandoor bread brushed with garlic butter.",
        price: 3.5,
        images: [
          "https://images.unsplash.com/photo-1626074353765-517a681e4073?w=800",
        ],
      },
      {
        name: "Vegetable Samosas",
        description: "Crispy pastry filled with spiced potato and peas.",
        price: 5.8,
        images: [
          "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=800",
          "https://images.unsplash.com/photo-1606491956689-2ea866880067?w=800",
        ],
      },
      {
        name: "Biryani",
        description: "Fragrant basmati rice with chicken and whole spices.",
        price: 12.2,
        images: [
          "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        ],
      },
      {
        name: "Mango Lassi",
        description: "Sweet yogurt drink blended with ripe mango.",
        price: 4.2,
        images: [
          "https://images.unsplash.com/photo-1623065425906-8c0c6a0c3c0a?w=800",
        ],
      },
      {
        name: "Dal Tadka",
        description: "Yellow lentils tempered with cumin and garlic.",
        price: 8.5,
        images: [
          "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
        ],
      },
    ],
  },
  {
    name: "Burger Junction",
    description:
      "Smash burgers, loaded fries, and milkshakes made for quick comfort food.",
    address: "Savska cesta 120, 10000 Zagreb",
    restaurantTypes: [RestaurantType.FAST_FOOD],
    meals: [
      {
        name: "Classic Cheeseburger",
        description: "Beef patty, cheddar, pickles, onion, special sauce.",
        price: 8.9,
        images: [
          "https://images.unsplash.com/photo-1568901346375-23e4bf99c0c8?w=800",
          "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
        ],
      },
      {
        name: "BBQ Bacon Burger",
        description: "Double smash patty, bacon, cheddar, smoky BBQ sauce.",
        price: 11.5,
        images: [
          "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800",
        ],
      },
      {
        name: "Crispy Chicken Burger",
        description: "Fried chicken fillet, lettuce, mayo, brioche bun.",
        price: 9.8,
        images: [
          "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800",
        ],
      },
      {
        name: "Loaded Fries",
        description: "Fries topped with cheese sauce, jalapeños, and bacon bits.",
        price: 5.9,
        images: [
          "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800",
          "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800",
        ],
      },
      {
        name: "Onion Rings",
        description: "Beer-battered onion rings with ranch dip.",
        price: 4.8,
        images: [
          "https://images.unsplash.com/photo-1639024471283-035266509aca?w=800",
        ],
      },
      {
        name: "Chocolate Milkshake",
        description: "Thick chocolate shake topped with whipped cream.",
        price: 4.5,
        images: [
          "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800",
        ],
      },
      {
        name: "Veggie Burger",
        description: "Plant-based patty, avocado, tomato, vegan mayo.",
        price: 9.2,
        images: [
          "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800",
        ],
      },
    ],
  },
  {
    name: "Bella Napoli Express",
    description:
      "Fast Italian classics — pizza by the slice, panini, and fresh salads.",
    address: "Branimirova 29, 10000 Zagreb",
    restaurantTypes: [RestaurantType.ITALIAN, RestaurantType.FAST_FOOD],
    meals: [
      {
        name: "Pepperoni Slice",
        description: "Thick-cut pepperoni on a crispy Neapolitan base.",
        price: 4.5,
        images: [
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800",
        ],
      },
      {
        name: "Prosciutto Panini",
        description: "Ciabatta with prosciutto, mozzarella, and arugula.",
        price: 7.9,
        images: [
          "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
          "https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=800",
        ],
      },
      {
        name: "Penne Arrabbiata",
        description: "Penne pasta in a spicy garlic tomato sauce.",
        price: 9.5,
        images: [
          "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
        ],
      },
      {
        name: "Four Cheese Pizza",
        description: "Mozzarella, gorgonzola, fontina, and parmesan.",
        price: 11.8,
        images: [
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
        ],
      },
      {
        name: "Caesar Salad",
        description: "Romaine, parmesan, croutons, Caesar dressing.",
        price: 7.2,
        images: [
          "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800",
          "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800",
        ],
      },
      {
        name: "Panna Cotta",
        description: "Vanilla cream dessert with berry coulis.",
        price: 5.5,
        images: [
          "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
        ],
      },
    ],
  },
];

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function clearSeedData() {
  // Wipe only seed-owned rows, in FK-safe order, so re-runs stay idempotent.
  const seedOrderFilter = {
    OR: [
      { user: { email: { in: [...SEED_USER_EMAILS] } } },
      { restaurant: { name: { in: [...SEED_RESTAURANT_NAMES] } } },
    ],
  };

  await prisma.$transaction([
    prisma.review.deleteMany({
      where: {
        OR: [
          { user: { email: { in: [...SEED_USER_EMAILS] } } },
          {
            meal: {
              restaurant: { name: { in: [...SEED_RESTAURANT_NAMES] } },
            },
          },
        ],
      },
    }),
    prisma.orderItem.deleteMany({
      where: { order: seedOrderFilter },
    }),
    prisma.order.deleteMany({
      where: seedOrderFilter,
    }),
    prisma.meal.deleteMany({
      where: { restaurant: { name: { in: [...SEED_RESTAURANT_NAMES] } } },
    }),
    prisma.restaurant.deleteMany({
      where: { name: { in: [...SEED_RESTAURANT_NAMES] } },
    }),
    prisma.user.deleteMany({
      where: { email: { in: [...SEED_USER_EMAILS] } },
    }),
  ]);
}

async function seedUsers(passwordHash: string) {
  const [admin, courier, ana, marko, iva] = await Promise.all([
    prisma.user.create({
      data: {
        firstName: "Luka",
        lastName: "Admin",
        email: "admin@fooddelivery.com",
        passwordHash,
        address: "Trg bana Jelačića 1, 10000 Zagreb",
        phone: "+385911000001",
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Petar",
        lastName: "Kurir",
        email: "courier@fooddelivery.com",
        passwordHash,
        address: "Heinzelova 40, 10000 Zagreb",
        phone: "+385911000002",
        role: Role.COURIER,
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Ana",
        lastName: "Kovač",
        email: "ana.kovac@email.com",
        passwordHash,
        address: "Radićeva 12, 10000 Zagreb",
        phone: "+385911111111",
        role: Role.CUSTOMER,
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Marko",
        lastName: "Horvat",
        email: "marko.horvat@email.com",
        passwordHash,
        address: "Vukovarska 68, 10000 Zagreb",
        phone: "+385922222222",
        role: Role.CUSTOMER,
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Iva",
        lastName: "Babić",
        email: "iva.babic@email.com",
        passwordHash,
        address: "Dubravkin trg 4, 10000 Zagreb",
        phone: "+385933333333",
        role: Role.CUSTOMER,
      },
    }),
  ]);

  return { admin, courier, customers: [ana, marko, iva] as const };
}

async function seedRestaurantsAndMeals() {
  const created = [];

  for (const restaurant of restaurantsSeed) {
    const createdRestaurant = await prisma.restaurant.create({
      data: {
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        restaurantTypes: restaurant.restaurantTypes,
        meals: {
          create: restaurant.meals.map((meal) => ({
            name: meal.name,
            description: meal.description,
            price: meal.price,
            images: meal.images,
          })),
        },
      },
      include: { meals: true },
    });

    created.push(createdRestaurant);
  }

  return created;
}

type SeedRestaurant = Awaited<ReturnType<typeof seedRestaurantsAndMeals>>[number];
type SeedCustomer = Awaited<ReturnType<typeof seedUsers>>["customers"][number];
type SeedCourier = Awaited<ReturnType<typeof seedUsers>>["courier"];

async function seedOrders(
  customers: readonly SeedCustomer[],
  courier: SeedCourier,
  restaurants: SeedRestaurant[],
) {
  const [ana, marko, iva] = customers;
  const [
    nonna,
    dragon,
    casa,
    spice,
    burger,
    bella,
  ] = restaurants;

  const orderDefs: Array<{
    customer: SeedCustomer;
    restaurant: SeedRestaurant;
    status: OrderStatus;
    courierId: number | null;
    createdAt: Date;
    estimatedDeliveryTime: Date | null;
    items: Array<{ mealName: string; quantity: number }>;
  }> = [
    {
      customer: ana,
      restaurant: nonna,
      status: OrderStatus.DELIVERED,
      courierId: courier.id,
      createdAt: hoursAgo(72),
      estimatedDeliveryTime: hoursAgo(70),
      items: [
        { mealName: "Margherita Pizza", quantity: 1 },
        { mealName: "Tiramisu", quantity: 2 },
      ],
    },
    {
      customer: marko,
      restaurant: dragon,
      status: OrderStatus.DELIVERED,
      courierId: courier.id,
      createdAt: hoursAgo(60),
      estimatedDeliveryTime: hoursAgo(58),
      items: [
        { mealName: "Kung Pao Chicken", quantity: 1 },
        { mealName: "Egg Fried Rice", quantity: 1 },
        { mealName: "Vegetable Spring Rolls", quantity: 1 },
      ],
    },
    {
      customer: iva,
      restaurant: casa,
      status: OrderStatus.DELIVERED,
      courierId: courier.id,
      createdAt: hoursAgo(48),
      estimatedDeliveryTime: hoursAgo(46),
      items: [
        { mealName: "Chicken Tacos", quantity: 2 },
        { mealName: "Guacamole & Chips", quantity: 1 },
      ],
    },
    {
      customer: ana,
      restaurant: spice,
      status: OrderStatus.DELIVERED,
      courierId: courier.id,
      createdAt: hoursAgo(36),
      estimatedDeliveryTime: hoursAgo(34),
      items: [
        { mealName: "Butter Chicken", quantity: 1 },
        { mealName: "Garlic Naan", quantity: 2 },
        { mealName: "Mango Lassi", quantity: 1 },
      ],
    },
    {
      customer: marko,
      restaurant: burger,
      status: OrderStatus.DELIVERED,
      courierId: courier.id,
      createdAt: hoursAgo(30),
      estimatedDeliveryTime: hoursAgo(28),
      items: [
        { mealName: "BBQ Bacon Burger", quantity: 1 },
        { mealName: "Loaded Fries", quantity: 1 },
        { mealName: "Chocolate Milkshake", quantity: 1 },
      ],
    },
    {
      customer: iva,
      restaurant: bella,
      status: OrderStatus.DELIVERED,
      courierId: null,
      createdAt: hoursAgo(24),
      estimatedDeliveryTime: hoursAgo(22),
      items: [
        { mealName: "Four Cheese Pizza", quantity: 1 },
        { mealName: "Caesar Salad", quantity: 1 },
      ],
    },
    {
      customer: ana,
      restaurant: dragon,
      status: OrderStatus.OUT_FOR_DELIVERY,
      courierId: courier.id,
      createdAt: hoursAgo(2),
      estimatedDeliveryTime: hoursFromNow(0.5),
      items: [
        { mealName: "Beef Chow Mein", quantity: 1 },
        { mealName: "Hot and Sour Soup", quantity: 1 },
      ],
    },
    {
      customer: marko,
      restaurant: nonna,
      status: OrderStatus.PREPARING,
      courierId: null,
      createdAt: hoursAgo(1),
      estimatedDeliveryTime: hoursFromNow(1),
      items: [
        { mealName: "Spaghetti Carbonara", quantity: 1 },
        { mealName: "Caprese Salad", quantity: 1 },
      ],
    },
    {
      customer: iva,
      restaurant: spice,
      status: OrderStatus.PREPARING,
      courierId: null,
      createdAt: hoursAgo(0.75),
      estimatedDeliveryTime: hoursFromNow(1.25),
      items: [
        { mealName: "Chicken Tikka Masala", quantity: 1 },
        { mealName: "Vegetable Samosas", quantity: 1 },
        { mealName: "Garlic Naan", quantity: 1 },
      ],
    },
    {
      customer: marko,
      restaurant: casa,
      status: OrderStatus.DELIVERED,
      courierId: courier.id,
      createdAt: hoursAgo(96),
      estimatedDeliveryTime: hoursAgo(94),
      items: [
        { mealName: "Beef Burrito", quantity: 1 },
        { mealName: "Churros", quantity: 2 },
      ],
    },
  ];

  const createdOrders = [];

  for (const def of orderDefs) {
    const mealByName = new Map(
      def.restaurant.meals.map((meal) => [meal.name, meal]),
    );

    const items = def.items.map((item) => {
      const meal = mealByName.get(item.mealName);
      if (!meal) {
        throw new Error(
          `Meal "${item.mealName}" not found in restaurant "${def.restaurant.name}"`,
        );
      }

      return {
        meal,
        quantity: item.quantity,
        priceAtPurchase: meal.price,
      };
    });

    const totalPrice = items.reduce(
      (sum, item) => sum + Number(item.priceAtPurchase) * item.quantity,
      0,
    );

    const order = await prisma.order.create({
      data: {
        status: def.status,
        paymentMethod: PaymentMethod.CASH,
        totalPrice,
        orderAddress: def.customer.address,
        estimatedDeliveryTime: def.estimatedDeliveryTime,
        userId: def.customer.id,
        restaurantId: def.restaurant.id,
        courierId: def.courierId,
        createdAt: def.createdAt,
        items: {
          create: items.map((item) => ({
            mealId: item.meal.id,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          })),
        },
      },
      include: {
        items: {
          include: { meal: true },
        },
      },
    });

    createdOrders.push(order);
  }

  return createdOrders;
}

type SeedOrder = Awaited<ReturnType<typeof seedOrders>>[number];

async function seedReviews(orders: SeedOrder[]) {
  // Only review meals that the customer actually ordered.
  const deliveredOrders = orders.filter(
    (order) => order.status === OrderStatus.DELIVERED,
  );

  const reviewDefs: Array<{
    order: SeedOrder;
    mealName: string;
    rating: number;
    comment: string | null;
  }> = [
    {
      order: deliveredOrders[0],
      mealName: "Margherita Pizza",
      rating: 5,
      comment: "Perfect crust and fresh basil. Will order again!",
    },
    {
      order: deliveredOrders[0],
      mealName: "Tiramisu",
      rating: 4,
      comment: null,
    },
    {
      order: deliveredOrders[1],
      mealName: "Kung Pao Chicken",
      rating: 5,
      comment: "Great heat and crunchy peanuts.",
    },
    {
      order: deliveredOrders[1],
      mealName: "Egg Fried Rice",
      rating: 3,
      comment: "Solid, but a bit oily.",
    },
    {
      order: deliveredOrders[2],
      mealName: "Chicken Tacos",
      rating: 4,
      comment: "Fresh salsa and generous portions.",
    },
    {
      order: deliveredOrders[3],
      mealName: "Butter Chicken",
      rating: 5,
      comment: "Creamy and aromatic — excellent.",
    },
    {
      order: deliveredOrders[3],
      mealName: "Garlic Naan",
      rating: 5,
      comment: null,
    },
    {
      order: deliveredOrders[4],
      mealName: "BBQ Bacon Burger",
      rating: 4,
      comment: "Smoky and juicy. Fries were great too.",
    },
    {
      order: deliveredOrders[5],
      mealName: "Four Cheese Pizza",
      rating: 2,
      comment: "Cheese was good, but arrived a bit cold.",
    },
    {
      order: deliveredOrders[6],
      mealName: "Beef Burrito",
      rating: 4,
      comment: null,
    },
  ];

  for (const def of reviewDefs) {
    const item = def.order.items.find(
      (orderItem) => orderItem.meal.name === def.mealName,
    );

    if (!item) {
      throw new Error(
        `Cannot review "${def.mealName}" — it was not part of order #${def.order.id}`,
      );
    }

    await prisma.review.create({
      data: {
        userId: def.order.userId,
        mealId: item.mealId,
        rating: def.rating,
        comment: def.comment,
      },
    });
  }
}

async function main() {
  console.log("Seeding database...");

  // ---------------------------------------------------------------------------
  // Reset previous seed data (idempotent)
  // ---------------------------------------------------------------------------
  console.log("Clearing previous seed data...");
  await clearSeedData();

  // ---------------------------------------------------------------------------
  // Users (1 admin, 1 courier, 3 customers)
  // ---------------------------------------------------------------------------
  console.log("Creating users...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const { admin, courier, customers } = await seedUsers(passwordHash);

  // ---------------------------------------------------------------------------
  // Restaurants + meals
  // ---------------------------------------------------------------------------
  console.log("Creating restaurants and meals...");
  const restaurants = await seedRestaurantsAndMeals();

  // ---------------------------------------------------------------------------
  // Orders + order items
  // ---------------------------------------------------------------------------
  console.log("Creating orders...");
  const orders = await seedOrders(customers, courier, restaurants);

  // ---------------------------------------------------------------------------
  // Reviews (only for meals the customer ordered)
  // ---------------------------------------------------------------------------
  console.log("Creating reviews...");
  await seedReviews(orders);

  console.log("Seed completed successfully.");
  console.log(`  Admin:    ${admin.email}`);
  console.log(`  Courier:  ${courier.email}`);
  console.log(
    `  Customers: ${customers.map((customer) => customer.email).join(", ")}`,
  );
  console.log(`  Password for all demo users: ${DEMO_PASSWORD}`);
  console.log(`  Restaurants: ${restaurants.length}`);
  console.log(`  Orders: ${orders.length}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
