// Quiz Corner question bank — fun, kid-friendly, offline.
// Three types; a daily round takes one of each:
//   trivia : multiple choice with playful wrong answers
//   tf     : true or false
//   emoji  : decode the emoji puzzle
// `answer` is always the exact text of the correct option.

export const TRIVIA = [
  { q: 'Which animal sleeps standing up?', options: ['Horse', 'Penguin', 'Snake', 'Goldfish'], answer: 'Horse' },
  { q: 'What is a group of lions called?', options: ['A pride', 'A roar squad', 'A mane gang', 'A flock'], answer: 'A pride' },
  { q: 'How many legs does a spider have?', options: ['8', '6', '10', 'Too many'], answer: '8' },
  { q: 'Which planet is famous for its rings?', options: ['Saturn', 'Mars', 'Mercury', 'Earth 2'], answer: 'Saturn' },
  { q: 'What do caterpillars turn into?', options: ['Butterflies', 'Dragonflies', 'Worm wizards', 'Beetles'], answer: 'Butterflies' },
  { q: 'Which is the largest animal EVER to live on Earth?', options: ['Blue whale', 'T-Rex', 'Elephant', 'Megalodon'], answer: 'Blue whale' },
  { q: 'What color are flamingos when they hatch?', options: ['Grey', 'Pink', 'Orange', 'Invisible'], answer: 'Grey' },
  { q: 'How many hearts does an octopus have?', options: ['3', '1', '8', 'Zero, just vibes'], answer: '3' },
  { q: 'What is the fastest land animal?', options: ['Cheetah', 'Race horse', 'Ostrich', 'A very late kid'], answer: 'Cheetah' },
  { q: 'Which fruit has its seeds on the OUTSIDE?', options: ['Strawberry', 'Banana', 'Mango', 'Watermelon'], answer: 'Strawberry' },
  { q: 'What do pandas eat almost all day?', options: ['Bamboo', 'Pizza', 'Fish', 'Honey'], answer: 'Bamboo' },
  { q: 'Which planet is closest to the Sun?', options: ['Mercury', 'Venus', 'Mars', 'The Moon'], answer: 'Mercury' },
  { q: 'What is a baby kangaroo called?', options: ['A joey', 'A cub', 'A pouchling', 'A kangarette'], answer: 'A joey' },
  { q: 'How many bones does a shark have?', options: ['Zero', '206', '99', '1,000'], answer: 'Zero' },
  { q: 'Which bird can fly backwards?', options: ['Hummingbird', 'Eagle', 'Penguin', 'Chicken'], answer: 'Hummingbird' },
  { q: 'What is the biggest ocean on Earth?', options: ['Pacific', 'Atlantic', 'Indian', 'The bathtub'], answer: 'Pacific' },
  { q: 'What do bees collect from flowers?', options: ['Nectar', 'Ketchup', 'Seeds', 'Perfume'], answer: 'Nectar' },
  { q: 'Which animal can regrow its tail?', options: ['Lizard', 'Cat', 'Rabbit', 'Hamster'], answer: 'Lizard' },
  { q: 'How long is a day on Earth, exactly?', options: ['About 24 hours', 'Exactly 25 hours', '12 hours', 'Depends on homework'], answer: 'About 24 hours' },
  { q: 'What is the tallest animal in the world?', options: ['Giraffe', 'Elephant', 'Polar bear', 'Basketball player'], answer: 'Giraffe' },
  { q: 'Which of these is NOT a real dinosaur?', options: ['Broccolisaurus', 'Triceratops', 'Stegosaurus', 'Velociraptor'], answer: 'Broccolisaurus' },
  { q: 'What makes popcorn pop?', options: ['Water inside turning to steam', 'Tiny explosions of butter', 'Air escaping', 'Magic'], answer: 'Water inside turning to steam' },
  { q: 'Which country invented pizza?', options: ['Italy', 'France', 'USA', 'Pizza Land'], answer: 'Italy' },
  { q: 'What is frozen water called?', options: ['Ice', 'Snow soup', 'Crystal juice', 'Cold water'], answer: 'Ice' },
  { q: 'How many colors are in a rainbow?', options: ['7', '5', '10', 'Infinity'], answer: '7' },
  { q: 'Which animal is known as the "ship of the desert"?', options: ['Camel', 'Horse', 'Desert whale', 'Scorpion'], answer: 'Camel' },
  { q: 'What do tadpoles grow up to be?', options: ['Frogs', 'Fish', 'Turtles', 'Tadpole grown-ups'], answer: 'Frogs' },
  { q: 'Which body part never stops growing?', options: ['Ears and nose', 'Feet', 'Teeth', 'Elbows'], answer: 'Ears and nose' },
  { q: 'What is the hottest planet in our solar system?', options: ['Venus', 'Mercury', 'Mars', 'The Sun (trick!)'], answer: 'Venus' },
  { q: 'What is a baby cat called?', options: ['A kitten', 'A cub', 'A catlet', 'A mini-meow'], answer: 'A kitten' },
  { q: 'Which sense do dogs use best?', options: ['Smell', 'Sight', 'Taste', 'Wi-Fi'], answer: 'Smell' },
  { q: 'What are clouds made of?', options: ['Tiny water droplets', 'Cotton candy', 'Smoke', 'Sheep wool'], answer: 'Tiny water droplets' },
  { q: 'How many continents are there?', options: ['7', '5', '9', '50'], answer: '7' },
  { q: 'Which animal has the best memory in the animal kingdom?', options: ['Elephant', 'Goldfish', 'Chicken', 'Sloth'], answer: 'Elephant' },
  { q: 'What do you call molten rock AFTER it comes out of a volcano?', options: ['Lava', 'Magma', 'Hot sauce', 'Fire juice'], answer: 'Lava' },
  { q: 'Which instrument has 88 keys?', options: ['Piano', 'Guitar', 'Drums', 'A very locked door'], answer: 'Piano' },
  { q: 'What is the largest planet in our solar system?', options: ['Jupiter', 'Saturn', 'Earth', 'Pluto'], answer: 'Jupiter' },
  { q: 'Where do polar bears live?', options: ['The Arctic (North Pole)', 'Antarctica (South Pole)', 'Alaska Zoo only', 'Iceland malls'], answer: 'The Arctic (North Pole)' },
  { q: 'What is a tornado made of?', options: ['Spinning wind', 'Angry clouds', 'Sky water', 'Dragon breath'], answer: 'Spinning wind' },
  { q: 'Which food do koalas munch on?', options: ['Eucalyptus leaves', 'Bamboo', 'Fish', 'Cookies'], answer: 'Eucalyptus leaves' },
];

export const TRUE_FALSE = [
  { q: 'Octopuses have three hearts.', answer: true },
  { q: 'Bananas grow on trees.', answer: false, why: 'Banana plants are giant herbs!' },
  { q: 'Sea otters hold hands while they sleep.', answer: true },
  { q: 'Lightning never strikes the same place twice.', answer: false, why: 'It strikes tall places again and again!' },
  { q: 'A snail can sleep for three years.', answer: true },
  { q: 'Goldfish have a 3-second memory.', answer: false, why: 'They can remember things for months!' },
  { q: 'Honey never goes bad.', answer: true },
  { q: 'Humans have more than five senses.', answer: true, why: 'Balance, temperature, and more!' },
  { q: 'The Great Wall of China is visible from the Moon.', answer: false, why: 'Astronauts say it is not!' },
  { q: 'Some frogs can freeze solid in winter and hop away in spring.', answer: true },
  { q: 'Bats are blind.', answer: false, why: 'Bats can see AND use echo-location!' },
  { q: 'Cows have best friends.', answer: true },
  { q: 'Your hair and nails keep growing forever.', answer: false, why: 'They grow from living cells that stop.' },
  { q: 'Wombat poop is cube-shaped.', answer: true },
  { q: 'An ostrich hides its head in the sand when scared.', answer: false, why: 'They just run — up to 70 km/h!' },
  { q: 'Butterflies taste with their feet.', answer: true },
  { q: 'Mount Everest is the tallest mountain in our solar system.', answer: false, why: 'Mars has one THREE times taller!' },
  { q: 'Penguins propose to each other with pebbles.', answer: true },
  { q: 'Carrots make you see in the dark.', answer: false, why: 'They help your eyes, but no night vision!' },
  { q: 'A bolt of lightning is hotter than the surface of the Sun.', answer: true },
  { q: 'Sharks existed before trees.', answer: true },
  { q: 'Chameleons change color only to hide.', answer: false, why: 'It is mostly to show their mood!' },
  { q: 'It rains diamonds on Neptune.', answer: true },
  { q: 'Sloths are great swimmers.', answer: true, why: 'Three times faster in water than on land!' },
  { q: 'Bulls get angry when they see the color red.', answer: false, why: 'Bulls are colorblind to red — it is the movement!' },
  { q: 'The unicorn is the national animal of Scotland.', answer: true },
  { q: 'Dolphins call each other by name.', answer: true },
  { q: 'Your stomach gets a brand-new lining every few days.', answer: true },
];

export const EMOJI_PUZZLES = [
  { q: '🌞 + 🌻 = what word?', options: ['Sunflower', 'Hot plant', 'Summer', 'Yellow garden'], answer: 'Sunflower' },
  { q: '🌈 + 🐟 = what word?', options: ['Rainbow fish', 'Colorful swim', 'Fishbow', 'Wet rainbow'], answer: 'Rainbow fish' },
  { q: '⭐ + 🐟 = what animal?', options: ['Starfish', 'Glitter guppy', 'Space fish', 'Fish star'], answer: 'Starfish' },
  { q: '🧈 + 🪰 = what animal?', options: ['Butterfly', 'Grease bug', 'Toast pest', 'Flutter fly'], answer: 'Butterfly' },
  { q: '🌧️ + 🎀 = what word?', options: ['Rainbow', 'Wet gift', 'Storm ribbon', 'Drizzle bow'], answer: 'Rainbow' },
  { q: '🔥 + 🎆 = what word?', options: ['Fireworks', 'Hot sky', 'Boom flowers', 'Sky fire'], answer: 'Fireworks' },
  { q: '🍿 What movie snack am I?', options: ['Popcorn', 'Corn soup', 'Crunchy clouds', 'Butter rice'], answer: 'Popcorn' },
  { q: '☃️ + 👨 = what word?', options: ['Snowman', 'Cold dad', 'Ice guy', 'Winter person'], answer: 'Snowman' },
  { q: '🌙 + 💡 = what word?', options: ['Moonlight', 'Night lamp', 'Space bulb', 'Sleep light'], answer: 'Moonlight' },
  { q: '💧 + 🍈 = what fruit?', options: ['Watermelon', 'Juice ball', 'Wet melon', 'Rain fruit'], answer: 'Watermelon' },
  { q: '🧁 What treat am I?', options: ['Cupcake', 'Muffin hat', 'Frosting tower', 'Cake cup'], answer: 'Cupcake' },
  { q: '🐝 + 🍯 = where do I live?', options: ['Beehive', 'Honey house', 'Buzz palace', 'Sticky nest'], answer: 'Beehive' },
  { q: '🧊 + 👸 + ❄️ = what movie?', options: ['Frozen', 'Ice Princess Party', 'Cold Crown', 'Winter Girl'], answer: 'Frozen' },
  { q: '🕷️ + 🧑 = what hero?', options: ['Spider-Man', 'Bug Boy', 'Web Wizard', 'Creepy Guy'], answer: 'Spider-Man' },
  { q: '🧙‍♂️ + ⚡ + 🏰 = what story?', options: ['Harry Potter', 'Zap Wizard', 'Castle Magic', 'Lightning School'], answer: 'Harry Potter' },
  { q: '🦁 + 👑 = what movie?', options: ['The Lion King', 'Royal Cat', 'Mane Majesty', 'King of Fluff'], answer: 'The Lion King' },
  { q: '🐠 + 🔍 = what movie?', options: ['Finding Nemo', 'Fish Detective', 'Lost Guppy', 'Ocean Search'], answer: 'Finding Nemo' },
  { q: '🍫 + 🏭 + 🎩 = what story?', options: ['Charlie and the Chocolate Factory', 'Candy Business', 'The Cocoa Plant', 'Sweet Hat Inc.'], answer: 'Charlie and the Chocolate Factory' },
  { q: '🥔 + 🛋️ = what kind of person?', options: ['Couch potato', 'Sofa farmer', 'Lazy fry', 'Snack chair'], answer: 'Couch potato' },
  { q: '🐘 + 🏠 = which is bigger?', options: ['Depends on the house!', 'Always the elephant', 'Always the house', 'They are equal'], answer: 'Depends on the house!' },
  { q: '🌊 + 🏄 = what activity?', options: ['Surfing', 'Wave walking', 'Sea sliding', 'Water dancing'], answer: 'Surfing' },
  { q: '📚 + 🐛 = what kind of reader?', options: ['Bookworm', 'Page bug', 'Word caterpillar', 'Library beetle'], answer: 'Bookworm' },
  { q: '🌟 + 💥 + 🚀 = what movie saga?', options: ['Star Wars', 'Space Boom', 'Rocket Fight', 'Galaxy Battle'], answer: 'Star Wars' },
  { q: '🍦 + 🌞 = what happens?', options: ['It melts!', 'It gets a tan', 'Nothing', 'It becomes soup officially'], answer: 'It melts!' },
  { q: '🐭 + 🏰 + ✨ = what place?', options: ['Disneyland', 'Mouse Mansion', 'Rat Castle', 'Cheese Kingdom'], answer: 'Disneyland' },
  { q: '🎂 + 🎈 + 🎁 = what day?', options: ['Birthday', 'Party Tuesday', 'Gift Festival', 'Balloon Day'], answer: 'Birthday' },
];

// Deterministic per-day pick (round 0) or random (replays): one of each type.
export function buildRound(rand) {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const shuffle = (arr) => arr.map((v) => ({ v, r: rand() }))
    .sort((a, b) => a.r - b.r).map(({ v }) => v);

  const t = pick(TRIVIA);
  const f = pick(TRUE_FALSE);
  const e = pick(EMOJI_PUZZLES);
  return shuffle([
    { type: 'trivia', q: t.q, options: shuffle([...t.options]), answer: t.answer },
    { type: 'tf', q: f.q, options: ['True ✅', 'False ❌'],
      answer: f.answer ? 'True ✅' : 'False ❌', why: f.why },
    { type: 'emoji', q: e.q, options: shuffle([...e.options]), answer: e.answer },
  ]);
}
