// Display names, seeded from books the way the old Firepad page did it.
// Kept as a plain list so a peer can also type their own name.
export const USERS = [
  // The Expanse
  "Jim Holden",
  "Naomi Nagata",
  "Amos Burton",
  "Alex Kamal",
  "Bobbie Draper",
  // Old Man's War
  "John Perry",
  "Jane Sagan",
  "Hickory",
  "Dickory",
  "Savitri Guntupalli",
  "Zoë Boutin Perry",
  // Magic 2.0
  "Martin",
  "Phillip",
  "Jimmy",
  "Eddie",
  "Gary",
  "Tyler",
  "Jeff",
  "Roy",
  "Gwen",
  "Brit",
  "Ida",
  // Red Rising
  "Darrow",
  "Mustang",
  "Cassius",
  "Sevro",
  // Critical Failures
  "Tim",
  "Stacy",
  "Julian",
  "Cooper",
  "Mordred",
  "Katherine",
  "Dave",
  "Chaz",
  // Ender's Game
  "Ender",
  "Peter Wiggin",
  "Valentine Wiggin",
  "Bean",
  "Crazy Tom",
  "Dink Meeker",
  "Alai",
  "Carn Carby",
  "Dumper",
  "Fly Molo",
  "Han Tzu (Hot Soup)",
  "Petra Arkanian",
  "Shen",
  "Vlad",
  "Rooter",
  "Mandachuva",
  "Leaf-eater",
  "Human",
  "Star-looker",
  "Warmaker",
  "Planter",
  "Grass",
  "Fire-quencher",
  "Arrow",
  "Jane",
  "Poke",
  // The Wayfarers
  "Sissix",
  "Kizzy",
  "Jenks",
  "Lovey",
  "Rosemary Harper",
  "Pepper",
  "Blue",
  "Cidra",
];

export const randomUser = () => USERS[Math.floor(Math.random() * USERS.length)];

// Pick a name nobody in the room is using yet, so two peers rarely collide.
export const unusedUser = (takenNames = []) => {
  const taken = new Set(takenNames.filter(Boolean));
  const free = USERS.filter((name) => !taken.has(name));
  const pool = free.length ? free : USERS;
  return pool[Math.floor(Math.random() * pool.length)];
};
