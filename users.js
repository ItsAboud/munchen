const discordUsers = [
  {
    name: "_7ov",
    price: 25,
    description: "يوزر شبه ثلاثي",
    views: 120,
    available: true
  },
  {
    name: "ec.6",
    price: 20,
    description: "يوزر شبه ثلاثي",
    views: 98,
    available: true
  },
  {
    name: "gwx.",
    price: 45,
    description: "يوزر شبه ثلاثي فخم",
    views: 210,
    available: true
  },
  {
    name: "jx.w",
    price: 40,
    description: "يوزر شبه ثلاثي فخم",
    views: 180,
    available: true
  },
  {
    name: "pi0_",
    price: 35,
    description: "يوزر شبه ثلاثي فخم",
    views: 150,
    available: true
  },
  {
    name: "wg.n",
    price: 55,
    description: "يوزر شبه ثلاثي فخم",
    views: 250,
    available: true
  },
  // باقي الأمثلة "soon"
  ...Array.from({length: 14}, (_, i) => ({
    name: "soon",
    price: null,
    description: "قريباً",
    views: null,
    available: false
  }))
]; 